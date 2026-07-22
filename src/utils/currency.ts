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

/**
 * format จำนวนเงินเป็นตัวเลขคั่นหลักพัน **ไม่มีต่อท้าย "บาท"** — ใช้กับแถวรายรับ/รายหักในสลิปเงินเดือน
 * (P21, design `5.Payroll/2.1.Payslip Details (fullscreen).png`) ที่โชว์ตัวเลขอย่างเดียวชิดขวา ส่วน
 * "บาท" แยกเป็น `<span>` ต่างหากในตัว hero (`PayslipSummaryHero`/`PayslipLatestHero`)
 *
 * [ตัดสินใจเรื่องทศนิยม — คอมเมนต์ตาม progress.md P21]: PNG มีจำนวนเต็มไม่มีทศนิยม (เช่น "25,000")
 * แต่แถวที่มีค่า 0 กลับโชว์ "0.00" (ทศนิยม) อยู่ในรูปเดียวกัน — ไม่ intentional ที่จะแยกกฎตาม "เป็น 0
 * หรือไม่" (0 ก็คือจำนวนเต็มเหมือนกัน) เพราะจะทำให้ตัวเลขรูปแบบไม่คงเส้นคงวา จึงเลือกกฎเดียวที่สอดคล้อง
 * กันทั้งไฟล์: **ไม่โชว์ทศนิยมถ้าเป็นจำนวนเต็ม (รวม 0) โชว์ 2 ตำแหน่งเฉพาะเมื่อมีเศษสตางค์จริง**
 * (กันเงินหายจากการปัดถ้า backend เผลอส่งทศนิยมมา) — ผลคือแถวค่า 0 ในแอปนี้จะเห็น "0" ไม่ใช่ "0.00"
 * ต่างจาก PNG เล็กน้อย ถือเป็น deviation ที่ยอมรับได้ (ไม่กระทบความถูกต้องของตัวเลข)
 */
export function formatBahtAmount(amount: number): string {
  const hasFraction = amount % 1 !== 0
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
