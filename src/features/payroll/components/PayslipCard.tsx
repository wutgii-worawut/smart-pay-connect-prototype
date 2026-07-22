/**
 * features/payroll/components/PayslipCard.tsx — แถวประวัติสลิปเงินเดือน (จอ `1.Payslip History.png`,
 * feature-plans/05 §5.1, P21) — ห่อ `ListCard` (S6, shared) presentational ล้วน รับ `payslip` +
 * `onClick` เท่านั้น (data-fetching + navigate อยู่ที่ `PayslipListPage`)
 */
import { ListCard } from '@/components/ListCard'
import { formatBahtAmount } from '@/utils/currency'
import { formatThaiDate } from '@/utils/date'
import type { Payslip } from '../types/payslip'

interface PayslipCardProps {
  payslip: Payslip
  onClick: () => void
}

function CardIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    </div>
  )
}

export function PayslipCard({ payslip, onClick }: PayslipCardProps) {
  return (
    <ListCard
      leading={<CardIcon />}
      title={payslip.periodLabel}
      // ListCard.meta ปกติเป็นบรรทัดเดียวสีเทา (S6) — จอนี้มี 2 บรรทัดสีต่างกัน (Net Pay เขียว /
      // จ่ายวันที่ เทา) จึงใส่ <span className="block"> ครอบเองแต่ละบรรทัด override สีที่ตัวเอง
      // (parent wrapper ของ ListCard ยังคง text-sm text-secondary ไว้ แต่ child กำหนดสีตัวเองทับได้)
      meta={
        <>
          <span className="block font-semibold text-success">
            Net Pay {formatBahtAmount(payslip.netPay)} บาท
          </span>
          <span className="mt-1 block">📅 จ่ายวันที่ {formatThaiDate(payslip.payDate)}</span>
        </>
      }
      onClick={onClick}
    />
  )
}
