import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { calendarHandlers, resetCalendarScenarios, setHolidaysScenario } from '@/mocks/handlers/calendar'
import { CalendarShellPage } from './CalendarShellPage'

const server = setupServer(...calendarHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  // fix "วันนี้" กันนับถอยหลัง/ปีเริ่มต้นไม่ deterministic (testing.md)
  vi.setSystemTime(new Date('2026-07-22T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  resetCalendarScenarios()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CalendarShellPage />
    </QueryClientProvider>,
  )
}

describe('CalendarShellPage', () => {
  it('เริ่มต้นที่แท็บ "ปฏิทินการลา" (default ใหม่ — จอ 6.1 เป็นจอแรกของกลุ่ม design) → แสดงปฏิทิน + legend ไม่เห็นรายการวันหยุด', async () => {
    renderPage()

    // "ลาพักร้อน" ขึ้นทั้ง legend + detail section (default วันนี้ 2026-07-22 มี 2 คนลาพักร้อนตาม mock)
    expect((await screen.findAllByText('ลาพักร้อน')).length).toBeGreaterThan(0)
    expect(screen.getByText('ลาป่วย')).toBeInTheDocument()
    expect(screen.getByText('ลากิจ')).toBeInTheDocument()
    expect(screen.queryByText('รายการวันหยุด')).not.toBeInTheDocument()
  })

  it('สลับไปแท็บ "วันหยุด" → แสดง hero วันหยุดถัดไป + รายการวันหยุดปี 2569 ซ่อนปฏิทินการลา', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('ลาพักร้อน')

    await user.click(screen.getByRole('tab', { name: 'วันหยุด' }))

    expect(await screen.findByText('วันหยุดถัดไป · อีก 6 วัน')).toBeInTheDocument()
    expect(screen.getAllByText('วันเฉลิมพระชนมพรรษาฯ').length).toBeGreaterThan(0)
    expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument()
    expect(screen.getByText('วันสงกรานต์')).toBeInTheDocument()
    expect(screen.queryByText('ลากิจ')).not.toBeInTheDocument()
  })

  it('กดรายการวันหยุด → เปิด HolidayDetails แสดงรายละเอียดตรงกับที่กด', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'วันหยุด' }))
    await screen.findByText('วันจักรี')

    await user.click(screen.getByText('วันจักรี'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('วันที่')).toBeInTheDocument()
    expect(within(dialog).getByText('6 เมษายน 2569')).toBeInTheDocument()
  })

  it('scenario error → แสดง ErrorState + กด "ลองใหม่" เรียก query ใหม่', async () => {
    setHolidaysScenario('error')
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'วันหยุด' }))

    expect(await screen.findByText('โหลดรายการวันหยุดไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setHolidaysScenario('data')
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    await waitFor(() => expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument())
  })
})
