/**
 * src/utils/date.ts — ตัวช่วยเรื่องวันที่ที่ใช้ร่วมทุก feature (architecture.md §4.1-4.2)
 *
 * กติกา:
 * - Calendar date (วันในปฏิทิน ไม่มี concept เวลา/timezone) เดินทางเป็น string 'YYYY-MM-DD' ตลอดสาย
 *   parse ด้วย `parse(str, 'yyyy-MM-dd', new Date())` เท่านั้น — ห้าม `new Date(str)` (parse เป็น UTC เที่ยงคืน)
 * - แสดงผล พ.ศ. ผ่าน formatThaiDate เท่านั้น — ห้ามบวก 543 กระจายตามหน้าอื่น
 * - pure function ล้วน ไม่มี React/hook — ห้าม network/side effect
 */
import { eachDayOfInterval, format, isWeekend, parse } from 'date-fns'
import { th } from 'date-fns/locale'
import type { LeaveDayEntry } from '@/types/leave'

const DATE_FORMAT = 'yyyy-MM-dd'

/** parse string 'YYYY-MM-DD' เป็น local Date (ห้ามใช้ new Date(str) ตรง ๆ — §4.2) */
function parseCalendarDate(dateStr: string): Date {
  return parse(dateStr, DATE_FORMAT, new Date())
}

export type ThaiDateFormat = 'd-MMM-yyyy' | 'd-MMMM-yyyy' | 'MMMM-yyyy'

/**
 * แสดงวันที่แบบไทย พ.ศ. (ปี ค.ศ. + 543) — จุดเดียวที่บวก 543 ทั้งระบบ
 * รับ Date หรือ string 'YYYY-MM-DD' (สะดวกต่อ caller ที่ถือ calendar date เป็น string อยู่แล้ว)
 *
 * รูปแบบที่รองรับ (ค่าเริ่มต้น 'd-MMM-yyyy'):
 * - 'd-MMM-yyyy'   -> "1 มิ.ย. 2569"
 * - 'd-MMMM-yyyy'  -> "1 มิถุนายน 2569"
 * - 'MMMM-yyyy'    -> "มิถุนายน พ.ศ. 2569"
 */
export function formatThaiDate(
  date: Date | string,
  pattern: ThaiDateFormat = 'd-MMM-yyyy',
): string {
  const d = typeof date === 'string' ? parseCalendarDate(date) : date
  const be = d.getFullYear() + 543

  switch (pattern) {
    case 'd-MMM-yyyy':
      return format(d, `d MMM '${be}'`, { locale: th })
    case 'd-MMMM-yyyy':
      return format(d, `d MMMM '${be}'`, { locale: th })
    case 'MMMM-yyyy':
      return format(d, `MMMM 'พ.ศ. ${be}'`, { locale: th })
  }
}

/**
 * คืนรายการ "วันทำงาน" (string 'YYYY-MM-DD') ในช่วง [start, end] (inclusive) — กรองเสาร์-อาทิตย์
 * และวันหยุดบริษัทออก (D1 plan.md §1)
 * - pure function รับ `holidays: string[]` เป็น param — ห้ามเรียก network/hook ข้างใน
 * - เป็น preview ฝั่ง frontend เท่านั้น server คำนวณซ้ำด้วยชุดวันหยุดเดียวกันเป็นตัวจริง
 *
 * @param startStr วันเริ่ม 'YYYY-MM-DD'
 * @param endStr วันสิ้นสุด 'YYYY-MM-DD'
 * @param holidays รายการวันหยุดบริษัท 'YYYY-MM-DD' (จาก GET /holidays?year=)
 * @returns รายการวันทำงาน 'YYYY-MM-DD' — คืน [] ถ้า endStr < startStr (ไม่ throw, ให้ฟอร์ม/Zod เป็นคน validate)
 */
export function listLeaveWorkingDays(
  startStr: string,
  endStr: string,
  holidays: string[],
): string[] {
  if (endStr < startStr) return []

  const start = parseCalendarDate(startStr)
  const end = parseCalendarDate(endStr)

  return eachDayOfInterval({ start, end })
    .filter((d) => !isWeekend(d) && !holidays.includes(format(d, DATE_FORMAT)))
    .map((d) => format(d, DATE_FORMAT))
}

/**
 * รวมจำนวนวันลาจากรายการ LeaveDayEntry: full=1, am=0.5, pm=0.5
 * pure function — ใช้กับผลลัพธ์ที่ประกอบจาก listLeaveWorkingDays + period ที่ผู้ใช้เลือกต่อวัน (P16)
 */
export function sumLeaveDays(days: LeaveDayEntry[]): number {
  return days.reduce((sum, day) => sum + (day.period === 'full' ? 1 : 0.5), 0)
}
