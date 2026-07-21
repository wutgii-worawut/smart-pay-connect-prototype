/**
 * utils/citizenId.ts — pure formatting สำหรับเลขบัตรประชาชน 13 หลัก (P6, feature-plans/00 §1 S16)
 * ใช้กับ TextInput mask="citizenId" (จอ 1.LINEOA-Registration.png: "1-2345-67890-12-3")
 * ไม่มี validation/checksum ที่นี่ — แค่จัดรูปแบบการแสดงผล (checksum เป็นหน้าที่ Zod ของฟอร์ม P9)
 */

/** ความยาวกลุ่มตัวเลขตาม design: 1-4-5-2-1 = 13 หลัก */
const GROUP_LENGTHS = [1, 4, 5, 2, 1] as const

/** ตัดอักขระที่ไม่ใช่ตัวเลขออก จำกัดไม่เกิน 13 หลัก */
export function extractCitizenIdDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 13)
}

/** จัดกลุ่มตัวเลขดิบเป็นรูปแบบ "1-2345-67890-12-3" (กลุ่มที่ยังกรอกไม่ครบจะถูกตัดไว้เท่าที่มี) */
export function formatCitizenId(raw: string): string {
  const digits = extractCitizenIdDigits(raw)
  const groups: string[] = []
  let cursor = 0
  for (const groupLength of GROUP_LENGTHS) {
    if (cursor >= digits.length) break
    groups.push(digits.slice(cursor, cursor + groupLength))
    cursor += groupLength
  }
  return groups.join('-')
}
