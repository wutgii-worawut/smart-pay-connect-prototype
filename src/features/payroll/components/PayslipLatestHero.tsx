/**
 * features/payroll/components/PayslipLatestHero.tsx — การ์ดน้ำเงินสลิปล่าสุด (จอ `1.Payslip
 * History.png`, feature-plans/05 §5.1, P21) — presentational ล้วน รับ `payslip` + `onView` เท่านั้น
 * (data-fetching + navigate อยู่ที่ `PayslipListPage`)
 */
import { formatBahtAmount } from '@/utils/currency'
import { formatThaiDate } from '@/utils/date'
import type { Payslip } from '../types/payslip'

interface PayslipLatestHeroProps {
  payslip: Payslip
  onView: () => void
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

function CardIcon() {
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
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

export function PayslipLatestHero({ payslip, onView }: PayslipLatestHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-card bg-primary p-5 text-white shadow-card">
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-sm font-medium">💰 สลิปล่าสุด · {payslip.periodLabel}</p>

        <p className="mt-4 text-sm text-white/80">เงินรับสุทธิ (Net Pay)</p>
        <p className="text-4xl font-bold">
          {formatBahtAmount(payslip.netPay)} <span className="text-lg font-normal">บาท</span>
        </p>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-white/90">
          <CalendarIcon />
          จ่ายวันที่ {formatThaiDate(payslip.payDate)}
        </p>

        <div className="mt-4 border-t border-white/20 pt-4">
          <button
            type="button"
            onClick={onView}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-primary"
          >
            <CardIcon />
            ดูสลิป
          </button>
        </div>
      </div>
    </div>
  )
}
