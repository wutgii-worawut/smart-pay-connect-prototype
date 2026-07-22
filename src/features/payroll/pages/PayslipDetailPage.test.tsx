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
  payrollHandlers,
  resetPayrollScenarios,
  setEmailPayslipScenario,
  setPayslipDetailScenario,
} from '@/mocks/handlers/payroll'
import { PayslipDetailPage } from './PayslipDetailPage'

const server = setupServer(...payrollHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetPayrollScenarios()
  appQueryClient.clear()
})
afterAll(() => server.close())

function renderPage(client?: QueryClient) {
  const queryClient =
    client ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } })

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
          { path: '/payroll/:id', element: <PayslipDetailPage /> },
          { path: '/payroll', element: <p>ประวัติสลิป</p> },
        ],
      },
    ],
    { initialEntries: ['/payroll/payslip-2026-06'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('PayslipDetailPage', () => {
  it('โหลดสำเร็จ → แสดง 3 การ์ด (พนักงาน/รายรับ/รายหัก) + ปุ่มส่งอีเมล', async () => {
    renderPage()

    expect(await screen.findByText('เงินเดือน มิถุนายน 2569')).toBeInTheDocument()
    expect(screen.getByText('พนักงานรายวัน')).toBeInTheDocument()
    expect(screen.getByText('รายรับ')).toBeInTheDocument()
    expect(screen.getByText('รายหัก')).toBeInTheDocument()

    // พนักงาน
    expect(screen.getByText('01009')).toBeInTheDocument()
    expect(screen.getByText('กุหลาบ ประพฤติดี')).toBeInTheDocument()

    // รายรับ
    expect(screen.getByText('เงินเดือนพื้นฐาน')).toBeInTheDocument()
    expect(screen.getByText('25,000')).toBeInTheDocument()

    // รายหัก
    expect(screen.getByText('ประกันสังคม')).toBeInTheDocument()
    expect(screen.getByText('-750')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'ส่งเข้าอีเมล' })).toBeEnabled()
  })

  it('query error → ErrorState + ลองใหม่สำเร็จ', async () => {
    setPayslipDetailScenario('error')
    renderPage()

    expect(
      await screen.findByText('โหลดรายละเอียดสลิปเงินเดือนไม่สำเร็จ กรุณาลองใหม่'),
    ).toBeInTheDocument()

    setPayslipDetailScenario('data')
    await userEvent.setup().click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(await screen.findByText('เงินเดือน มิถุนายน 2569')).toBeInTheDocument()
  })

  it('กดส่งเข้าอีเมล → สำเร็จ (204 body ว่าง) → toast "ส่งอีเมลแล้ว"', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ส่งเข้าอีเมล' }))

    expect(await screen.findByText('ส่งอีเมลแล้ว')).toBeInTheDocument()
  })

  it('กดปิด → navigate กลับ', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ปิด' }))

    expect(await screen.findByText('ประวัติสลิป')).toBeInTheDocument()
  })

  it('ส่งอีเมลล้มเหลว → toast error จาก ApiError.message', async () => {
    setEmailPayslipScenario('error')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ส่งเข้าอีเมล' }))

    expect(await screen.findByText('ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()
  })

  it('ปุ่มส่งเข้าอีเมล disabled ระหว่าง isPending (กันกดซ้ำ)', async () => {
    server.use(
      http.post('*/payroll/payslips/:id/email', async () => {
        await delay(50)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    const sendBtn = await screen.findByRole('button', { name: 'ส่งเข้าอีเมล' })
    await user.click(sendBtn)

    await waitFor(() => expect(sendBtn).toBeDisabled())
  })

  it('ไม่ retry อัตโนมัติเมื่อส่งอีเมลล้มเหลว (ใช้ query-client จริงของแอป) — ยิงครั้งเดียว', async () => {
    setEmailPayslipScenario('error')
    let hitCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/email')) hitCount += 1
    })

    const user = userEvent.setup()
    renderPage(appQueryClient)

    await user.click(await screen.findByRole('button', { name: 'ส่งเข้าอีเมล' }))

    await screen.findByText('ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hitCount).toBe(1)
  })
})
