/**
 * features/calendar/components/LeaveCalendarView.tsx — container ของแท็บ "ปฏิทินการลา" (จอ 6.1, P18)
 * ถือ state (`calendarMonth`, `selectedDate`) + query (`useLeaveCalendar`/`useDayDetail`) ของแท็บนี้เอง —
 * มิเรอร์ pattern `AttendanceHistoryPage` (feature-internal container ถือ query ได้ ไม่ใช่ presentational
 * D2 shared) ต่างจาก `CalendarShellPage` ที่ยังถือ query ของแท็บ "วันหยุด" อยู่ (แยก concern คนละแท็บ)
 *
 * ค่าเริ่มต้น: `calendarMonth`/`selectedDate` = เดือน/วันนี้ปัจจุบันจาก `new Date()` (lazy initializer
 * กัน re-render ทำเดือนขยับ + ให้ `vi.setSystemTime` มีผลตอน render จริงในเทสต์ เหมือน
 * `AttendanceHistoryPage`) — เลือก default `selectedDate` = วันนี้ (ไม่ใช่ null) ให้ detail section
 * โผล่ทันทีตาม design PNG (วงเขียวของ "วันนี้" เป็น affordance ว่ากดได้อยู่แล้ว)
 */
import { useState } from 'react'
import { format, parse } from 'date-fns'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { ApiError } from '@/lib/api-client'
import { useDayDetail } from '../hooks/useDayDetail'
import { useLeaveCalendar } from '../hooks/useLeaveCalendar'
import { buildLeaveMap } from '../utils/leaveCalendar'
import { CalendarLegend } from './CalendarLegend'
import { LeaveCalendar } from './LeaveCalendar'
import { LeaveDayDetailSection } from './LeaveDayDetailSection'

const DATE_FORMAT = 'yyyy-MM-dd'
const MONTH_FORMAT = 'yyyy-MM'

export function LeaveCalendarView() {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), DATE_FORMAT))

  const month = format(calendarMonth, MONTH_FORMAT)
  const calendarQuery = useLeaveCalendar(month)
  const detailQuery = useDayDetail(selectedDate)

  const leaveMap = calendarQuery.data ? buildLeaveMap(calendarQuery.data) : {}
  const selected = parse(selectedDate, DATE_FORMAT, new Date())

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card bg-white p-4">
        {calendarQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 border-primary" />
          </div>
        ) : calendarQuery.isError ? (
          <ErrorState
            message={
              calendarQuery.error instanceof ApiError
                ? calendarQuery.error.message
                : 'โหลดปฏิทินการลาไม่สำเร็จ'
            }
            onRetry={() => void calendarQuery.refetch()}
          />
        ) : (
          <>
            <LeaveCalendar
              leaveMap={leaveMap}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={selected}
              onSelectDay={(date) => setSelectedDate(format(date, DATE_FORMAT))}
            />
            <CalendarLegend />
          </>
        )}
      </div>

      <LeaveDayDetailSection
        date={selectedDate}
        entries={detailQuery.data ?? []}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onRetry={() => void detailQuery.refetch()}
      />
    </div>
  )
}
