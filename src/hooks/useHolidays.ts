/**
 * hooks/useHolidays.ts — useQuery ห่อ `GET /holidays?year=` (D1 plan.md §1)
 * ตั้งใจให้เป็นแค่ "thin wrapper" — ห้ามมี logic นับวันทำงาน/รวมวันลาในนี้ (นั่นคือหน้าที่ของ
 * `listLeaveWorkingDays`/`listLeaveCalendarDays`/`sumLeaveDays` ที่ `utils/date.ts` ซึ่งเป็น pure
 * function ทดสอบแยกต่างหากอยู่แล้ว) — hook นี้แค่ fetch + cache
 *
 * `staleTime` ยาว (24 ชม.) เพราะรายการวันหยุดบริษัทเปลี่ยนไม่บ่อย (D1) — ใช้ร่วมกันทั้ง leave (P16
 * ฟอร์มสร้างใบลา) และ calendar (P17-P18)
 */
import { useQuery } from '@tanstack/react-query'
import { getHolidays } from '@/lib/holidays'

export const holidaysQueryKey = (year: number) => ['holidays', year] as const

const HOLIDAYS_STALE_TIME_MS = 24 * 60 * 60 * 1000

export function useHolidays(year: number) {
  return useQuery({
    queryKey: holidaysQueryKey(year),
    queryFn: () => getHolidays(year),
    staleTime: HOLIDAYS_STALE_TIME_MS,
  })
}
