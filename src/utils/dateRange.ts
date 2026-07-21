/**
 * src/utils/dateRange.ts — แปลงระหว่าง react-day-picker `DateRange` (Date object)
 * กับ contract value `{ start, end }` ที่เป็น string 'YYYY-MM-DD' (architecture.md §4.2)
 * ใช้โดย `DateRangeField` (S16, P7) — pure function ล้วน ไม่มี React/hook
 *
 * กติกา §4.2: calendar date เดินทางเป็น string 'YYYY-MM-DD' ตลอดสาย — parse ด้วย
 * `parse(str, 'yyyy-MM-dd', new Date())` เท่านั้น ห้าม `new Date(str)`
 */
import { addDays, format, parse } from 'date-fns'
import type { DateRange } from 'react-day-picker'

const DATE_FORMAT = 'yyyy-MM-dd'

/** ค่าที่ DateRangeField รับ-ส่งออกไปนอกคอมโพเนนต์ (ตรง RHF field value) */
export interface DateRangeValue {
  start: string
  end: string
}

/** parse string 'YYYY-MM-DD' เป็น local Date (ห้ามใช้ new Date(str) ตรง ๆ — §4.2) */
function parseCalendarDateString(dateStr: string): Date {
  return parse(dateStr, DATE_FORMAT, new Date())
}

/**
 * react-day-picker `DateRange` (mode="range" onSelect) → `{start,end}` string
 * - ยังไม่มี `from` (ยังไม่ได้เลือกวันไหนเลย) → คืน null
 * - เลือกวันเดียว (มี `from` ไม่มี `to`) → ถือเป็น single-day: end = start (ตรง design 6.1)
 */
export function dateRangeToValue(range: DateRange | undefined): DateRangeValue | null {
  if (!range?.from) return null
  const start = format(range.from, DATE_FORMAT)
  const end = format(range.to ?? range.from, DATE_FORMAT)
  return { start, end }
}

/** `{start,end}` string → react-day-picker `DateRange` (สำหรับ prop `selected` ของ Calendar mode="range") */
export function valueToDateRange(value: DateRangeValue | null | undefined): DateRange | undefined {
  if (!value) return undefined
  return {
    from: parseCalendarDateString(value.start),
    to: parseCalendarDateString(value.end),
  }
}

/**
 * ขยับ "ถึงวันที่" ทีละ 1 วัน (ปุ่ม +/− ใต้ช่อง "ถึงวันที่" ใน DateRangeField, design 6.1) —
 * ไม่ให้ end ก่อน start (ปุ่ม "−" ที่ UI ต้อง disabled เองเมื่อ start===end อยู่แล้ว แต่กันซ้ำไว้ในนี้ด้วย
 * เผื่อเรียกตรง ๆ โดยไม่ผ่าน UI)
 */
export function shiftRangeEnd(value: DateRangeValue, deltaDays: number): DateRangeValue {
  const start = parseCalendarDateString(value.start)
  const nextEnd = addDays(parseCalendarDateString(value.end), deltaDays)
  const clamped = nextEnd < start ? start : nextEnd
  return { start: value.start, end: format(clamped, DATE_FORMAT) }
}
