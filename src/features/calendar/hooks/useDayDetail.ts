/**
 * features/calendar/hooks/useDayDetail.ts — useQuery ห่อ `GET /leave/calendar/{date}` (P18)
 * `enabled` กัน fetch ตอน date ยังว่าง (มิเรอร์ `useLeaveRequest` — ใช้ `''` แทน null กันต้อง `as`
 * ปิด error ตอนเรียก `getDayDetail(date)` ที่รับ `string` ล้วน) — cache ต่อวันให้กดเปิดซ้ำเร็ว (§10.3)
 */
import { useQuery } from '@tanstack/react-query'
import { getDayDetail } from '../api/getDayDetail'

export const dayDetailQueryKey = (date: string) => ['leave-calendar', 'day', date] as const

/** @param date 'YYYY-MM-DD' หรือ '' ถ้ายังไม่เลือกวัน (query ไม่ยิง) */
export function useDayDetail(date: string) {
  return useQuery({
    queryKey: dayDetailQueryKey(date),
    queryFn: () => getDayDetail(date),
    enabled: date.length > 0,
  })
}
