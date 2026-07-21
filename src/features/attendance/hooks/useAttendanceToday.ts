/**
 * features/attendance/hooks/useAttendanceToday.ts — useQuery ห่อ `GET /attendance/today`
 * query key เดียวกันนี้ถูก invalidate จาก useClockIn/useClockOut ตอนลงเวลาสำเร็จ (refetch สถานะล่าสุด)
 */
import { useQuery } from '@tanstack/react-query'
import { getToday } from '../api/getToday'

export const attendanceTodayQueryKey = ['attendance', 'today'] as const

export function useAttendanceToday() {
  return useQuery({
    queryKey: attendanceTodayQueryKey,
    queryFn: getToday,
  })
}
