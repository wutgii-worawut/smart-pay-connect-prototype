/**
 * components/DetailField.tsx — แถว label ซ้ายเทา + value ขวาเข้ม + เส้นคั่น (S8, feature-plans/00 §1)
 * ใช้ในหน้า detail: ใบลา (Leave/Approval), payslip, holiday
 */
import type { ReactNode } from 'react'

interface DetailFieldProps {
  label: string
  value: ReactNode
  className?: string
}

export function DetailField({ label, value, className }: DetailFieldProps) {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4 border-b border-text-secondary/10 py-4 last:border-b-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-right text-sm font-semibold text-primary-dark">{value}</span>
    </div>
  )
}
