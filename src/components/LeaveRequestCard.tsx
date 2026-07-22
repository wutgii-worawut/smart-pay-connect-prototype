/**
 * components/LeaveRequestCard.tsx — การ์ดใบลาใน list (feature-plans/00 §2, D2 plan.md §1)
 * ใช้ร่วม Leave (P14, ดูใบตัวเอง) และ Approval (P19, `showEmployeeName` โชว์ชื่อพนักงานแทนประเภทลา)
 *
 * ⚠️ D2 hard rule: presentational ล้วน — ห้าม useQuery/useMutation/navigate ในไฟล์นี้ ข้อมูล+callback
 * มาจาก props เท่านั้น (onClick ให้ page เป็นคนตัดสิน navigate ไปไหน)
 */
import { LeaveTypeIcon } from './LeaveTypeIcon'
import { ListCard } from './ListCard'
import { StatusBadge } from './StatusBadge'
import { formatThaiDateRange } from '@/utils/date'
import { LEAVE_TYPE_LABEL } from '@/utils/leaveType'
import type { LeaveRequest } from '@/types/leave'

interface LeaveRequestCardProps {
  request: LeaveRequest
  /** true = บรรทัดแรกโชว์ชื่อพนักงานแทนชื่อประเภทลา (ฝั่ง Approval, P19) */
  showEmployeeName?: boolean
  onClick?: () => void
}

export function LeaveRequestCard({ request, showEmployeeName = false, onClick }: LeaveRequestCardProps) {
  const dateLabel = formatThaiDateRange(request.startDate, request.endDate)
  const title =
    showEmployeeName && request.employeeName ? request.employeeName : LEAVE_TYPE_LABEL[request.type]

  return (
    <ListCard
      leading={<LeaveTypeIcon type={request.type} size="sm" />}
      title={title}
      trailing={<StatusBadge status={request.status} />}
      meta={`${dateLabel} · ${request.totalDays} วัน · ${request.periodSummary}`}
      onClick={onClick}
    />
  )
}
