import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { calendarHandlers } from '@/mocks/handlers/calendar'
import { LeaveCalendarView } from './LeaveCalendarView'

const server = setupServer(...calendarHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  // "วันนี้" fix ตรงกับ seed ของ mock (2026-07-22, มี 2 คนลาพักร้อน) — testing.md กันพึ่ง new Date() จริง
  vi.setSystemTime(new Date('2026-07-22T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LeaveCalendarView />
    </QueryClientProvider>,
  )
}

describe('LeaveCalendarView', () => {
  it('เปิดหน้า → default เดือน/วันนี้ (2026-07-22) โหลด detail 2 คนลาพักร้อนทันที', async () => {
    renderView()

    expect(await screen.findByText('วันที่ 22 กรกฎาคม 2569 (ลา 2 คน)')).toBeInTheDocument()
    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
    expect(screen.getByText('นายชล สมมุติ')).toBeInTheDocument()
    // 3 ที่ = legend (1) + detail entries ของ 2 คน (2)
    expect(screen.getAllByText('ลาพักร้อน')).toHaveLength(3)
  })

  it('กดวันอื่นที่มีคนลา (8 ก.ค. — ลาป่วย 1 คน) → detail section เปลี่ยนตามวันที่กด', async () => {
    const user = userEvent.setup()
    renderView()
    await screen.findByText('วันที่ 22 กรกฎาคม 2569 (ลา 2 คน)')

    // react-day-picker ใส่ชื่อวันในสัปดาห์ไทยเต็ม (format 'PPPP') นำหน้าเลขวันเสมอ — 2026-07-08 เป็นวันพุธ
    await user.click(screen.getByRole('button', { name: 'วันพุธที่ 8 กรกฎาคม 2026' }))

    expect(await screen.findByText('วันที่ 8 กรกฎาคม 2569 (ลา 1 คน)')).toBeInTheDocument()
    expect(screen.getByText('นางสาวพิมพ์ใจ ดีเลิศ')).toBeInTheDocument()
    // 2 ที่ = legend (1) + detail entry ของคนที่ลาป่วย (1)
    expect(screen.getAllByText('ลาป่วย')).toHaveLength(2)
    expect(screen.queryByText('นายกุหลาบ ประพฤติดี')).not.toBeInTheDocument()
  })

  it('กดวันที่ไม่มีใครลา → "ไม่มีคนลาในวันนี้"', async () => {
    const user = userEvent.setup()
    renderView()
    await screen.findByText('วันที่ 22 กรกฎาคม 2569 (ลา 2 คน)')

    // 2026-07-05 เป็นวันอาทิตย์
    await user.click(screen.getByRole('button', { name: 'วันอาทิตย์ที่ 5 กรกฎาคม 2026' }))

    expect(await screen.findByText('ไม่มีคนลาในวันนี้')).toBeInTheDocument()
  })

  it('M1: detail (วันนี้) error → แสดงปุ่มลองใหม่ในชั้นรายละเอียด (ไม่ dead-end) กดแล้ว refetch สำเร็จ', async () => {
    server.use(
      http.get('*/leave/calendar/:date', () =>
        HttpResponse.json(
          { error: { code: 'SERVER_ERROR', message: 'โหลดรายละเอียดวันที่นี้ไม่สำเร็จ' } },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderView()

    expect(await screen.findByText('โหลดรายละเอียดวันที่นี้ไม่สำเร็จ')).toBeInTheDocument()
    // หัวข้อยังโชว์วันที่ แต่ไม่มี "(ลา N คน)" ปลอมระหว่าง error (M1 heading glitch)
    expect(screen.getByText('วันที่ 22 กรกฎาคม 2569')).toBeInTheDocument()
    expect(screen.queryByText(/\(ลา/)).not.toBeInTheDocument()

    server.resetHandlers(...calendarHandlers)
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(await screen.findByText('วันที่ 22 กรกฎาคม 2569 (ลา 2 คน)')).toBeInTheDocument()
    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
  })

  it('scenario error → แสดง ErrorState + กด "ลองใหม่" โหลดสำเร็จ', async () => {
    server.use(
      http.get('*/leave/calendar', () =>
        HttpResponse.json(
          { error: { code: 'SERVER_ERROR', message: 'โหลดปฏิทินการลาไม่สำเร็จ กรุณาลองใหม่' } },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderView()

    expect(await screen.findByText('โหลดปฏิทินการลาไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    server.resetHandlers(...calendarHandlers)
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    await waitFor(() =>
      expect(screen.getByText('วันที่ 22 กรกฎาคม 2569 (ลา 2 คน)')).toBeInTheDocument(),
    )
  })
})
