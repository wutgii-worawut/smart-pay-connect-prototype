/**
 * src/types/holiday.ts — shared type สำหรับวันหยุดบริษัท (P17, feature-plans/06-calendar.md §6.2-6.3)
 * ใช้ร่วมกันทั้ง leave (P16 นับวันทำงาน ผ่าน `holidays.map(h => h.date)` — ดู `LeaveFormPage.tsx`) และ
 * calendar (P17 แสดงรายการ/รายละเอียดวันหยุด, P18 จุดวันหยุดในปฏิทิน) — วางที่ shared เพราะ
 * `lib/holidays.ts` (shared) ห้าม import จาก `features/` (กฎเหล็ก §6)
 *
 * 🔴 CONTRACT FLAG (P17): shape นี้ invented ทั้งหมด — §16.3 ระบุแค่ endpoint `GET /holidays?year=`
 * เดิม (P16) คืน `string[]` ล้วน ตอนนี้ enrich เป็น object ตามที่ design 6.2/6.3 ต้องใช้ (ชื่อไทย/อังกฤษ,
 * ประเภท, คำอธิบาย) — รอ backend/swagger ยืนยัน shape จริงอีกที
 */

/** ประเภทวันหยุด (สีต่างกันตาม token `--color-holiday-*`) — ราชการ=เขียว, ศาสนา=เหลือง, ราชวงศ์=ม่วง/ฟ้า */
export type HolidayType = 'government' | 'religious' | 'royal'

export interface Holiday {
  /** วันที่ 'YYYY-MM-DD' */
  date: string
  /** ชื่อวันหยุดภาษาไทย */
  name: string
  /** ชื่อวันหยุดภาษาอังกฤษ — ใช้เป็น subtitle ใน hero/details (ไม่บังคับมี) */
  nameEn?: string
  type: HolidayType
  /** คำอธิบายเพิ่มเติม — แสดงเป็นกล่อง info ใน `HolidayDetails` ถ้ามี (ไม่บังคับมี) */
  description?: string
}
