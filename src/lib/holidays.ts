/**
 * lib/holidays.ts — GET /holidays?year= (§16.3, D1 plan.md §1)
 * ย้ายมาจาก `src/api/holidays.ts` เดิม (ผู้ใช้เคาะ 2026-07-22: ไม่ต้องมีโฟลเดอร์ `src/api/` แยก —
 * `lib/` มี zone ของ eslint (no-restricted-paths) + เอกสารรองรับ data-fetch แบบ shared นี้อยู่แล้ว) —
 * ใช้ร่วมกันทั้ง leave (P16 ฟอร์มสร้างใบลา นับวันทำงาน) และ calendar (P17-P18)
 *
 * `lib/` ห้าม import จาก `features/` (กฎเหล็ก §6) — ไฟล์นี้ import แค่ `zod` + `api` จาก
 * `lib/api-client.ts` เท่านั้น ไม่แตะ feature ใด
 *
 * shape ปัจจุบันของ mock (`src/mocks/handlers/calendar.ts`) คืน `string[]` ('YYYY-MM-DD') ตรงตามที่
 * `listLeaveWorkingDays`/`listLeaveCalendarDays` (utils/date.ts) ต้องการอยู่แล้ว — ไม่ได้ทำ mapping
 * เพิ่ม ถ้า backend จริงส่ง object (`{date,name,type}`) ค่อยปรับ schema/mapping ตรงนี้ทีเดียว
 * (P17-P18 จะทำ mock เต็มของ endpoint นี้ — ไฟล์นี้แค่ผ่าน type รอบเดียว)
 */
import { z } from 'zod'
import { api } from './api-client'

const holidaysSchema = z.array(z.string())

/** @param year ปี ค.ศ. */
export async function getHolidays(year: number): Promise<string[]> {
  const data = await api.get<unknown>('/holidays', { params: { year } })
  return holidaysSchema.parse(data)
}
