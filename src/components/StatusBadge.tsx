/**
 * components/StatusBadge.tsx — pill จุดสี+ข้อความสถานะคำขอลา (S4, feature-plans/00 §1)
 * สีและ label ชุดเดียว reuse ทั้ง Leave และ Approval (feature-plans/00 §2) — token จาก @theme เท่านั้น
 */
import type { LeaveRequestStatus } from '@/types/leave'

interface StatusBadgeProps {
  status: LeaveRequestStatus
  className?: string
}

const STATUS_CONFIG: Record<LeaveRequestStatus, { label: string; className: string }> = {
  PENDING: { label: 'รออนุมัติ', className: 'bg-warning/10 text-warning' },
  APPROVED: { label: 'อนุมัติแล้ว', className: 'bg-success/10 text-success' },
  REJECTED: { label: 'ไม่อนุมัติ', className: 'bg-danger/10 text-danger' },
  CANCELLED: { label: 'ยกเลิก', className: 'bg-text-secondary/10 text-text-secondary' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
        config.className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </span>
  )
}
