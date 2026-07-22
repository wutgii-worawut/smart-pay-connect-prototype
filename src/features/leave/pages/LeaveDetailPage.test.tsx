import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { AppToaster } from '@/components/Toaster'
import { queryClient as appQueryClient } from '@/lib/query-client'
import {
  leaveHandlers,
  resetLeaveScenarios,
  setLeaveDetailScenario,
} from '@/mocks/handlers/leave'
import { LeaveDetailPage } from './LeaveDetailPage'

const server = setupServer(...leaveHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetLeaveScenarios()
  appQueryClient.clear()
})
afterAll(() => server.close())

function renderPage(client?: QueryClient) {
  const queryClient =
    client ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } })
  // AppToaster ต้องอยู่นอก route ที่จะถูก unmount ตอน navigate (ยกเลิกสำเร็จ → ออกจาก /leave/:id
  // ไป /leave) ไม่งั้น toast ถูกล้างหายไปพร้อม route เดิมก่อนจะได้เห็นผล — ใช้ layout route + <Outlet/>
  // มิเรอร์วิธี mount จริงที่ app/providers.tsx (AppToaster คงที่ระดับ root)
  function Layout() {
    return (
      <>
        <AppToaster />
        <Outlet />
      </>
    )
  }

  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/leave/:id', element: <LeaveDetailPage /> },
          { path: '/leave', element: <p>รายการใบลา</p> },
        ],
      },
    ],
    { initialEntries: ['/leave/leave-pending-3'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('LeaveDetailPage', () => {
  it('โหลดสำเร็จ (PENDING) → แสดงเลขที่ใบลา + ปุ่มยกเลิกคำขอ', async () => {
    renderPage()

    expect(await screen.findByText('ล 0706/10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ยกเลิกคำขอ' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'แก้ไขคำขอ' })).toBeDisabled()
  })

  it('query error → ErrorState + ปุ่มลองใหม่โหลดใหม่สำเร็จ', async () => {
    setLeaveDetailScenario('error')
    renderPage()

    expect(await screen.findByText('โหลดรายละเอียดใบลาไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setLeaveDetailScenario('pending')
    await userEvent.setup().click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(await screen.findByText('ล 0706/10')).toBeInTheDocument()
  })

  it('กดยกเลิกคำขอ → เปิด Drawer ยืนยัน → ยืนยันสำเร็จ → toast แดง "ยกเลิกคำขอแล้ว" + กลับหน้ารายการ', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ยกเลิกคำขอ' }))
    expect(await screen.findByText('ยืนยันยกเลิกคำขอลานี้?', { exact: false })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ยืนยันยกเลิกคำขอ' }))

    expect(await screen.findByText('ยกเลิกคำขอแล้ว')).toBeInTheDocument()
    expect(await screen.findByText('รายการใบลา')).toBeInTheDocument()
  })

  it('REQUEST_NOT_PENDING → toast แจ้งข้อความจาก server + refetch (ยังอยู่หน้า detail)', async () => {
    setLeaveDetailScenario('not-pending')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ยกเลิกคำขอ' }))
    await user.click(await screen.findByRole('button', { name: 'ยืนยันยกเลิกคำขอ' }))

    expect(await screen.findByText('คำขอนี้ไม่อยู่ในสถานะที่ยกเลิกได้')).toBeInTheDocument()
    // ยังอยู่หน้า detail เดิม (ไม่ navigate ออกไป) และ detail ถูก refetch แล้ว
    expect(screen.getByText('ล 0706/10')).toBeInTheDocument()
  })

  it('ปุ่มยืนยันยกเลิก disabled ระหว่าง isPending (กันกดซ้ำ)', async () => {
    setLeaveDetailScenario('not-pending')
    server.use(
      http.post('*/leave/requests/:id/cancel', async () => {
        await delay(50)
        return HttpResponse.json(
          { error: { code: 'REQUEST_NOT_PENDING', message: 'คำขอนี้ไม่อยู่ในสถานะที่ยกเลิกได้' } },
          { status: 409 },
        )
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ยกเลิกคำขอ' }))
    const confirmBtn = await screen.findByRole('button', { name: 'ยืนยันยกเลิกคำขอ' })
    await user.click(confirmBtn)

    await waitFor(() => expect(confirmBtn).toBeDisabled())
  })

  it('ไม่ retry อัตโนมัติเมื่อยกเลิกล้มเหลว (ใช้ query-client จริงของแอป) — ยิงครั้งเดียว', async () => {
    setLeaveDetailScenario('not-pending')
    let hitCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/cancel')) hitCount += 1
    })

    const user = userEvent.setup()
    renderPage(appQueryClient)

    await user.click(await screen.findByRole('button', { name: 'ยกเลิกคำขอ' }))
    await user.click(await screen.findByRole('button', { name: 'ยืนยันยกเลิกคำขอ' }))

    await screen.findByText('คำขอนี้ไม่อยู่ในสถานะที่ยกเลิกได้')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hitCount).toBe(1)
  })
})
