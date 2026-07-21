/**
 * utils/citizenId.ts — pure formatting + validation สำหรับเลขบัตรประชาชน 13 หลัก
 * (P6: formatting, feature-plans/00 §1 S16; P9: checksum, feature-plans/01 §1.1)
 * ใช้กับ TextInput mask="citizenId" (จอ 1.LINEOA-Registration.png: "1-2345-67890-12-3")
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

/**
 * ตรวจ checksum เลขบัตรประชาชนไทย 13 หลัก (สูตรมาตรฐานกรมการปกครอง) — ใช้กับ digits ล้วน
 * (เรียก `extractCitizenIdDigits` ก่อนเสมอ ฟังก์ชันนี้ไม่จัดการขีด/ช่องว่าง):
 *   sum = Σ digit[i] * (13 - i)  สำหรับ i = 0..11 (12 หลักแรก ไม่รวมหลักตรวจสอบ)
 *   checkDigit = (11 - (sum mod 11)) mod 10  ต้องเท่ากับหลักที่ 13 (index 12)
 */
export function isValidCitizenId(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false

  const digitValues = digits.split('').map(Number)
  const sum = digitValues
    .slice(0, 12)
    .reduce((acc, digit, index) => acc + digit * (13 - index), 0)
  const checkDigit = (11 - (sum % 11)) % 10

  return checkDigit === digitValues[12]
}
