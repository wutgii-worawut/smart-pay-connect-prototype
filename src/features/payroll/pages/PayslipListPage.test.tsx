import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { payrollHandlers, resetPayrollScenarios, setPayslipsScenario } from '@/mocks/handlers/payroll'
import { PayslipListPage } from './PayslipListPage'

const server = setupServer(...payrollHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetPayrollScenarios()
})
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  })

  const router = createMemoryRouter(
    [
      { path: '/payroll', element: <PayslipListPage /> },
      { path: '/payroll/:id', element: <p>รายละเอียดสลิป</p> },
    ],
    { initialEntries: ['/payroll'] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('PayslipListPage', () => {
  it('โหลดสำเร็จ → แสดง hero สลิปล่าสุด + การ์ดกำลังประมวลผล + ประวัติ', async () => {
    renderPage()

    // hero: สลิปล่าสุด (มิถุนายน 2569 — payDate ล่าสุดในบรรดา released)
    expect(await screen.findByText(/สลิปล่าสุด · มิถุนายน 2569/)).toBeInTheDocument()
    // "28,560" ปรากฏทั้งใน hero (ตัวเลขใหญ่) และแถวประวัติ (Net Pay 28,560 บาท) — ยืนยันมีอย่างน้อย 2 ที่
    expect(screen.getAllByText(/28,560/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: 'ดูสลิป' })).toBeInTheDocument()

    // การ์ดกำลังประมวลผล (กรกฎาคม 2569)
    expect(screen.getByText('กรกฎาคม 2569')).toBeInTheDocument()
    expect(screen.getByText('กำลังประมวลผล')).toBeInTheDocument()
    expect(screen.getByText('ยังไม่ออก')).toBeInTheDocument()

    // ประวัติ: ทั้งมิถุนายนและพฤษภาคม
    expect(screen.getByText('ประวัติสลิปเงินเดือน')).toBeInTheDocument()
    expect(screen.getAllByText('มิถุนายน 2569').length).toBeGreaterThan(0)
    expect(screen.getByText('พฤษภาคม 2569')).toBeInTheDocument()
    expect(screen.getByText('Net Pay 28,100 บาท')).toBeInTheDocument()
  })

  it('กดการ์ดประวัติ → navigate ไปหน้ารายละเอียด', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('พฤษภาคม 2569'))

    expect(await screen.findByText('รายละเอียดสลิป')).toBeInTheDocument()
  })

  it('กดปุ่ม "ดูสลิป" ที่ hero → navigate ไปหน้ารายละเอียดของสลิปล่าสุด', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'ดูสลิป' }))

    expect(await screen.findByText('รายละเอียดสลิป')).toBeInTheDocument()
  })

  it('รายการว่าง → EmptyState', async () => {
    setPayslipsScenario('empty')
    renderPage()

    expect(await screen.findByText('ยังไม่มีสลิปเงินเดือนในปีนี้')).toBeInTheDocument()
  })

  it('query error → ErrorState + ลองใหม่สำเร็จ', async () => {
    setPayslipsScenario('error')
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('โหลดสลิปเงินเดือนไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setPayslipsScenario('data')
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(await screen.findByText(/สลิปล่าสุด/)).toBeInTheDocument()
  })
})
