/**
 * features/attendance/hooks/useAttendanceHistory.ts — useQuery ห่อ `GET /attendance/history?month=`
 * query key แยกต่อเดือน (`month` เป็นส่วนหนึ่งของ key) — สลับเดือนใน DropdownFilter แล้ว refetch อัตโนมัติ
 */
import { useQuery } from '@tanstack/react-query'
import { getHistory } from '../api/getHistory'

export const attendanceHistoryQueryKey = (month: string) => ['attendance', 'history', month] as const

export function useAttendanceHistory(month: string) {
  return useQuery({
    queryKey: attendanceHistoryQueryKey(month),
    queryFn: () => getHistory(month),
  })
}
