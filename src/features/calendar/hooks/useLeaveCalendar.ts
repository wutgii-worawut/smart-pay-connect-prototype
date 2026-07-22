/**
 * features/calendar/hooks/useLeaveCalendar.ts — useQuery ห่อ `GET /leave/calendar?month=` (P18)
 * query key แยกต่อเดือน — เปลี่ยนเดือนใน `LeaveCalendar` แล้ว refetch อัตโนมัติ (มิเรอร์
 * `useAttendanceHistory`/`useHolidays`) staleTime สั้นกว่า holidays เพราะใบลาใหม่เข้ามาเรื่อย ๆ
 */
import { useQuery } from '@tanstack/react-query'
import { getLeaveCalendar } from '../api/getLeaveCalendar'

export const leaveCalendarQueryKey = (month: string) => ['leave-calendar', month] as const

const LEAVE_CALENDAR_STALE_TIME_MS = 5 * 60 * 1000

/** @param month 'YYYY-MM' */
export function useLeaveCalendar(month: string) {
  return useQuery({
    queryKey: leaveCalendarQueryKey(month),
    queryFn: () => getLeaveCalendar(month),
    staleTime: LEAVE_CALENDAR_STALE_TIME_MS,
  })
}
