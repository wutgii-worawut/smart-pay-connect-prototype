/**
 * features/calendar/utils/holidays.ts — pure functions สำหรับหน้าจอวันหยุด (P17, จอ 6.2/6.3)
 * ไม่มี React/network ในไฟล์นี้เลย — testable ตรง ๆ ตาม testing.md (ภาคบังคับ)
 *
 * วันที่ใน `Holiday.date` เป็น string 'YYYY-MM-DD' เดินทางตามกติกา §4.2 — parse ด้วย
 * `parse(str, 'yyyy-MM-dd', new Date())` เท่านั้น (ห้าม `new Date(str)`)
 */
import { differenceInCalendarDays, format, parse } from 'date-fns'
import { th } from 'date-fns/locale'
import { toBuddhistYear } from '@/utils/date'
import type { Holiday, HolidayType } from '@/types/holiday'

const DATE_FORMAT = 'yyyy-MM-dd'

function parseCalendarDate(dateStr: string): Date {
  return parse(dateStr, DATE_FORMAT, new Date())
}

/** label ประเภทวันหยุดภาษาไทย ตาม design 6.2 (list tag) / 6.3 (details) */
export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  government: 'วันหยุดราชการ',
  religious: 'วันสำคัญศาสนา',
  royal: 'วันสำคัญราชวงศ์',
}

/**
 * วันหยุดถัดไปจากวันนี้ (date >= today, ใกล้สุด) — คืน `null` ถ้าไม่มี (list ว่าง หรือวันหยุดทั้งหมด
 * ในปีผ่านไปแล้ว) เทียบวันที่แบบ string ตรง ๆ (รูปแบบ 'YYYY-MM-DD' เรียงตามลำดับเวลาได้พอดีอยู่แล้ว
 * ไม่ต้อง parse เป็น Date ทีละตัวก่อนเทียบ) — ไม่ mutate array ต้นฉบับ
 */
export function getNextHoliday(holidays: Holiday[], today: Date): Holiday | null {
  const todayStr = format(today, DATE_FORMAT)
  const upcoming = holidays
    .filter((holiday) => holiday.date >= todayStr)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return upcoming[0] ?? null
}

/**
 * จำนวน "วันปฏิทิน" จากวันนี้ถึง `dateStr` (ไม่รวมเวลา, `differenceInCalendarDays`) — 0 ถ้าตรงกับวันนี้
 * พอดี, ติดลบถ้า `dateStr` ผ่านไปแล้ว — แสดงผลล้วน (โดยประมาณ ไม่มีผลทางธุรกรรม)
 */
export function daysUntil(dateStr: string, today: Date): number {
  return differenceInCalendarDays(parseCalendarDate(dateStr), today)
}

/** ชื่อวันในสัปดาห์ภาษาไทยล้วน เช่น "อังคาร" (ไม่มีคำนำหน้า "วัน" — ตรงกับ meta line ของ list ใน design 6.2) */
export function formatThaiWeekday(dateStr: string): string {
  return format(parseCalendarDate(dateStr), 'EEEE', { locale: th })
}

/** ส่วนของวันที่สำหรับกล่องวันที่ย่อ (list/hero/details): เลขวัน + เดือนย่อไทย เช่น "28" / "ก.ค." */
export interface HolidayDateParts {
  day: string
  monthShort: string
}

export function splitHolidayDate(dateStr: string): HolidayDateParts {
  const date = parseCalendarDate(dateStr)
  return {
    day: format(date, 'd'),
    monthShort: format(date, 'MMM', { locale: th }),
  }
}

export interface HolidayYearOption {
  value: string
  label: string
}

/**
 * ตัวเลือกปี (DropdownFilter) ของ "รายการวันหยุด" — `span` ปีก่อน/หลัง `referenceYear` (ค.ศ.)
 * value เป็น ค.ศ. (ตรง query param `year`) label เป็น "ปี {พ.ศ.}" ผ่าน `toBuddhistYear` เดียวกับที่อื่น
 */
export function generateHolidayYearOptions(referenceYear: number, span = 2): HolidayYearOption[] {
  return Array.from({ length: span * 2 + 1 }, (_, index) => referenceYear - span + index).map(
    (year) => ({ value: String(year), label: `ปี ${toBuddhistYear(year)}` }),
  )
}
