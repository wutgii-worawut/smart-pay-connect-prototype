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
  approvalHandlers,
  resetApprovalScenarios,
  setApprovalActionScenario,
  setApprovalDetailScenario,
} from '@/mocks/handlers/approval'
import { ApprovalDetailPage } from './ApprovalDetailPage'

// ⚠️ ไม่ import `@/features/auth` ในไฟล์นี้ (กฎเหล็ก §6 — features/approval ห้าม import ข้าม
// feature แม้แต่ในเทสต์) — role gate (`ProtectedRoute requireRole="manager"`) ทดสอบแยกที่
// `app/ApprovalDetailRoute.test.tsx` (compose ระดับ app/ ที่ import ได้ทั้งสอง feature)

const server = setupServer(...approvalHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetApprovalScenarios()
  appQueryClient.clear()
})
afterAll(() => server.close())

function renderPage(client?: QueryClient) {
  const queryClient =
    client ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } })

  // AppToaster ต้องอยู่นอก route ที่จะถูก unmount ตอน navigate (มิเรอร์ `LeaveDetailPage.test.tsx` P15)
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
          { path: '/approval/:id', element: <ApprovalDetailPage /> },
          { path: '/approval', element: <p>รายการรออนุมัติ</p> },
        ],
      },
    ],
    { initialEntries: ['/approval/approval-pending-1'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('ApprovalDetailPage', () => {
  it('โหลดสำเร็จ (PENDING) → แสดงชื่อพนักงาน + ปุ่ม "ไม่อนุมัติ"/"อนุมัติ" (mode approver-action)', async () => {
    renderPage()

    expect(await screen.findByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ไม่อนุมัติ' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'อนุมัติ' })).toBeEnabled()
  })

  it('query error → ErrorState + ปุ่มลองใหม่โหลดใหม่สำเร็จ', async () => {
    setApprovalDetailScenario('error')
    renderPage()

    expect(await screen.findByText('โหลดรายละเอียดใบลาไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setApprovalDetailScenario('pending')
    await userEvent.setup().click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(await screen.findByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
  })

  it('กดอนุมัติ → toast เขียว "อนุมัติคำขอลาแล้ว" + กลับหน้ารายการ', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'อนุมัติ' }))

    expect(await screen.findByText('อนุมัติคำขอลาแล้ว')).toBeInTheDocument()
    expect(await screen.findByText('รายการรออนุมัติ')).toBeInTheDocument()
  })

  it('กดไม่อนุมัติโดยไม่กรอกความเห็น → error ใต้ช่อง ไม่ยิง mutation', async () => {
    let hitCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/reject')) hitCount += 1
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ไม่อนุมัติ' }))

    expect(await screen.findByText('กรุณาระบุเหตุผลการไม่อนุมัติ')).toBeInTheDocument()
    expect(hitCount).toBe(0)
    server.events.removeAllListeners()
  })

  it('กดไม่อนุมัติพร้อมกรอกเหตุผล → toast แดง "ไม่อนุมัติคำขอลาแล้ว" + กลับหน้ารายการ', async () => {
    const user = userEvent.setup()
    renderPage()

    const textarea = await screen.findByLabelText('ความเห็นผู้อนุมัติ (ถ้ามี)')
    await user.type(textarea, 'งานยังไม่เรียบร้อย')
    await user.click(screen.getByRole('button', { name: 'ไม่อนุมัติ' }))

    expect(await screen.findByText('ไม่อนุมัติคำขอลาแล้ว')).toBeInTheDocument()
    expect(await screen.findByText('รายการรออนุมัติ')).toBeInTheDocument()
  })

  it('REQUEST_NOT_PENDING ตอนอนุมัติ → toast แจ้งข้อความจาก server + refetch (ยังอยู่หน้า detail)', async () => {
    setApprovalActionScenario('not-pending')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'อนุมัติ' }))

    expect(await screen.findByText('คำขอนี้ถูกดำเนินการไปแล้ว กรุณาลองใหม่')).toBeInTheDocument()
    // ยังอยู่หน้า detail เดิม (ไม่ navigate ออกไป) และ detail ถูก refetch แล้ว
    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
  })

  it('ปุ่มอนุมัติ/ไม่อนุมัติ disabled ระหว่าง isPending (กันกดซ้ำ)', async () => {
    server.use(
      http.post('*/approval/requests/:id/approve', async () => {
        await delay(50)
        return HttpResponse.json(
          { error: { code: 'REQUEST_NOT_PENDING', message: 'คำขอนี้ถูกดำเนินการไปแล้ว กรุณาลองใหม่' } },
          { status: 409 },
        )
      }),
    )
    const user = userEvent.setup()
    renderPage()

    const approveBtn = await screen.findByRole('button', { name: 'อนุมัติ' })
    const rejectBtn = screen.getByRole('button', { name: 'ไม่อนุมัติ' })
    await user.click(approveBtn)

    await waitFor(() => expect(approveBtn).toBeDisabled())
    expect(rejectBtn).toBeDisabled()
  })

  it('ไม่ retry อัตโนมัติเมื่ออนุมัติล้มเหลว (ใช้ query-client จริงของแอป) — ยิงครั้งเดียว', async () => {
    setApprovalActionScenario('not-pending')
    let hitCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/approve')) hitCount += 1
    })

    const user = userEvent.setup()
    renderPage(appQueryClient)

    await user.click(await screen.findByRole('button', { name: 'อนุมัติ' }))

    await screen.findByText('คำขอนี้ถูกดำเนินการไปแล้ว กรุณาลองใหม่')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hitCount).toBe(1)
    server.events.removeAllListeners()
  })

  it('ใบที่อนุมัติแล้ว (APPROVED) → mode approver-view มีแค่ปุ่ม "ปิด" ไม่มีปุ่มตัดสิน', async () => {
    setApprovalDetailScenario('approved')
    renderPage()

    expect(await screen.findByRole('button', { name: 'ปิด' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'อนุมัติ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ไม่อนุมัติ' })).not.toBeInTheDocument()
  })
})
