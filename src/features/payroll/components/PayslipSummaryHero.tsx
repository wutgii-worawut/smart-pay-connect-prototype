/**
 * features/payroll/components/PayslipSummaryHero.tsx — สรุปรับสุทธิบนสุดของจอรายละเอียด (จอ
 * `2.Payslip Details.png`, feature-plans/05 §5.2, P21) — presentational ล้วน รับ `detail` เท่านั้น
 */
import { formatBahtAmount } from '@/utils/currency'
import { formatThaiDate } from '@/utils/date'
import type { PayslipDetail } from '../types/payslip'

interface PayslipSummaryHeroProps {
  detail: PayslipDetail
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

export function PayslipSummaryHero({ detail }: PayslipSummaryHeroProps) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <p className="text-sm text-text-secondary">รับสุทธิ</p>
      <p className="text-4xl font-bold text-primary">
        {formatBahtAmount(detail.netPay)} <span className="text-lg font-normal">บาท</span>
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
        <CalendarIcon />
        เงินเดือนออก {formatThaiDate(detail.payDate)} {detail.periodRound}
      </p>
    </div>
  )
}
