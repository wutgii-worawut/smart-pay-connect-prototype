/**
 * features/payroll/components/PayslipSection.tsx — การ์ดหัวข้อ + รายการ `DetailField` (จอ
 * `2.Payslip Details.png` / `2.1...fullscreen.png`, feature-plans/05 §5.2, P21) — ใช้ซ้ำ 3 ที่:
 * พนักงาน / รายรับ / รายหัก — presentational ล้วน รับ `{title, dotColor?, items}` เท่านั้น
 *
 * [ขอบเขต P21] ไม่ทำแถวรวมยอด ("รวมรายรับ"/"รวมรายการหัก") หรือรายการ "ภาษีหัก ณ ที่จ่าย" แยกการ์ด
 * ที่เห็นใน PNG fullscreen — spec ของเฟสนี้ (feature-plans/05 + งานที่ได้รับ) ระบุ component เป็นแค่
 * การ์ดหัวข้อ+list DetailField จาก array ล้วน ไม่มี prop คำนวณผลรวม และการซัมยอดเงินฝั่ง frontend เข้า
 * ข่ายกติกา "ห้ามคำนวณเงินฝั่งหน้าบ้าน" (code-style.md/architecture) จึงไม่เพิ่มเอง — ปล่อยเป็น
 * follow-up ให้ designer/backend ยืนยันว่าต้องการแถวสรุปหรือไม่ (จะมาพร้อม field รวมจาก API ก็ได้)
 */
import { DetailField } from '@/components/DetailField'

export interface PayslipSectionItem {
  label: string
  value: string
}

interface PayslipSectionProps {
  title: string
  /** สีจุดหน้าหัวข้อ (bg-* token) เช่น 'bg-text-secondary' (พนักงาน) 'bg-success' (รายรับ) 'bg-warning' (รายหัก) */
  dotColor?: string
  items: PayslipSectionItem[]
}

export function PayslipSection({ title, dotColor = 'bg-text-secondary', items }: PayslipSectionProps) {
  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={['h-2 w-2 shrink-0 rounded-full', dotColor].join(' ')} aria-hidden="true" />
        <h2 className="font-semibold text-primary-dark">{title}</h2>
      </div>
      <div className="mt-1">
        {items.map((item) => (
          <DetailField key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  )
}
