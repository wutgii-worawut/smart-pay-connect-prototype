import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  attendanceHandlers,
  resetAttendanceScenarios,
  setAttendanceHistoryScenario,
} from '@/mocks/handlers/attendance'
import { AttendanceHistoryPage } from './AttendanceHistoryPage'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  // fix "วันนี้" กันค่าเริ่มต้นของ filter เดือน + label ตัวเลือกไม่ deterministic (testing.md)
  vi.setSystemTime(new Date('2026-07-21T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  resetAttendanceScenarios()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceHistoryPage />
    </QueryClientProvider>,
  )
}

describe('AttendanceHistoryPage', () => {
  it('scenario data (default) → แสดงรายการไทม์ไลน์', async () => {
    renderPage()

    expect(await screen.findByText('9 ตุลาคม 2568')).toBeInTheDocument()
    expect(screen.getByText('08:12')).toBeInTheDocument()
  })

  it('scenario empty → แสดง EmptyState', async () => {
    setAttendanceHistoryScenario('empty')
    renderPage()

    expect(await screen.findByText('เดือนนี้ยังไม่มีประวัติลงเวลา')).toBeInTheDocument()
  })

  it('scenario error → แสดง ErrorState พร้อมปุ่มลองใหม่ กดแล้ว refetch สำเร็จ', async () => {
    setAttendanceHistoryScenario('error')
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('โหลดประวัติลงเวลาไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setAttendanceHistoryScenario('data')
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    await waitFor(() => {
      expect(screen.getByText('9 ตุลาคม 2568')).toBeInTheDocument()
    })
  })
})
