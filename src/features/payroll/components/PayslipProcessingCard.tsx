/**
 * features/payroll/components/PayslipProcessingCard.tsx — การ์ดเดือนที่ status='processing' (จอ
 * `1.Payslip History.png`, feature-plans/05 §5.1, P21) — "กำลังประมวลผล" + badge ส้ม "ยังไม่ออก"
 * presentational ล้วน ไม่กดได้ (ยังไม่มีสลิปให้ดู)
 */
import type { Payslip } from '../types/payslip'

interface PayslipProcessingCardProps {
  payslip: Payslip
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function PayslipProcessingCard({ payslip }: PayslipProcessingCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-dashed border-warning/50 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
        <ClockIcon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary-dark">{payslip.periodLabel}</p>
        <p className="text-sm text-text-secondary">กำลังประมวลผล</p>
      </div>
      <span className="shrink-0 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning">
        ยังไม่ออก
      </span>
    </div>
  )
}
