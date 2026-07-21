/**
 * src/utils/currency.ts — ตัวช่วย format เงินบาทที่ใช้ร่วมทุก feature (code-style.md)
 * pure function ล้วน ไม่มี React/hook — ห้ามคำนวณเงินจริงฝั่ง frontend (นี่แค่ format ตัวเลขที่ได้จาก server)
 */

/**
 * format จำนวนเงินเป็นสตริงบาทไทย: คั่นหลักพัน + ทศนิยม 2 ตำแหน่งเสมอ + ต่อท้าย "บาท"
 * เช่น formatBaht(28560) -> "28,560.00 บาท", formatBaht(-1500.5) -> "-1,500.50 บาท"
 */
export function formatBaht(amount: number): string {
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} บาท`
}
