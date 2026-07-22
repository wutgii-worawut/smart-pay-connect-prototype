/**
 * lib/holidays.ts — GET /holidays?year= (§16.3, D1 plan.md §1)
 * ย้ายมาจาก `src/api/holidays.ts` เดิม (ผู้ใช้เคาะ 2026-07-22: ไม่ต้องมีโฟลเดอร์ `src/api/` แยก —
 * `lib/` มี zone ของ eslint (no-restricted-paths) + เอกสารรองรับ data-fetch แบบ shared นี้อยู่แล้ว) —
 * ใช้ร่วมกันทั้ง leave (P16 ฟอร์มสร้างใบลา นับวันทำงาน — ใช้แค่ `date` ผ่าน `.map(h => h.date)`) และ
 * calendar (P17-P18 แสดงรายการ/รายละเอียดวันหยุดเต็มรูป)
 *
 * `lib/` ห้าม import จาก `features/` (กฎเหล็ก §6) — ไฟล์นี้ import แค่ `zod` + `Holiday` type (shared,
 * `src/types/`) + `api` จาก `lib/api-client.ts` เท่านั้น ไม่แตะ feature ใด
 *
 * P17: enrich shape จาก `string[]` เดิม → `Holiday[]` object (วันที่+ชื่อไทย/อังกฤษ+ประเภท+คำอธิบาย)
 * ตามที่ design 6.2/6.3 ต้องใช้ — ดู CONTRACT FLAG ที่ `src/types/holiday.ts`
 */
import { z } from 'zod'
import type { Holiday } from '@/types/holiday'
import { api } from './api-client'

const holidaySchema = z.object({
  date: z.iso.date(),
  name: z.string(),
  nameEn: z.string().optional(),
  type: z.enum(['government', 'religious', 'royal']),
  description: z.string().optional(),
})

const holidaysSchema = z.array(holidaySchema)

/** @param year ปี ค.ศ. */
export async function getHolidays(year: number): Promise<Holiday[]> {
  const data = await api.get<unknown>('/holidays', { params: { year } })
  return holidaysSchema.parse(data)
}
