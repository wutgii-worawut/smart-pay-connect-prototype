/**
 * features/leave/components/LeaveSuccessView.tsx — จอสำเร็จ (จอ 7 "ส่งคำขอลาเรียบร้อย",
 * feature-plans/03 §3.7, P16) ห่อ `SuccessScreen` (S17) ด้วยการ์ดสรุปใบลาที่เพิ่งส่ง
 *
 * mount ทับที่เดิมแบบ in-page state จาก `LeaveFormPage` (ไม่ navigate ไป route ใหม่) — มิเรอร์
 * `RegisterSuccessPage` (จอ 1.4, P10) มากกว่า `ClockSuccessOverlay` (attendance P12 ที่ทับซ้อนแผนที่
 * เดิมด้วย `absolute inset-0`) เพราะที่นี่ "สลับเนื้อหาแทนทั้งหน้า" ไม่ใช่ overlay ทับของเดิมที่ยัง
 * ต้องเห็นอยู่ข้างหลัง — ไม่จำเป็นต้องมี `position: relative` ผูกกับ parent
 */
import { LeaveTypeIcon } from '@/components/LeaveTypeIcon'
import { PrimaryButton } from '@/components/PrimaryButton'
import { StatusBadge } from '@/components/StatusBadge'
import { SuccessScreen } from '@/components/SuccessScreen'
import { formatThaiDate } from '@/utils/date'
import { LEAVE_TYPE_LABEL } from '@/utils/leaveType'
import type { LeaveCreateResult } from '@/types/leave'

interface LeaveSuccessViewProps {
  result: LeaveCreateResult
  onBackToPending: () => void
}

function HistoryIcon() {
  return (
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
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function LeaveSuccessView({ result, onBackToPending }: LeaveSuccessViewProps) {
  const dateLabel =
    result.startDate === result.endDate
      ? formatThaiDate(result.startDate)
      : `${formatThaiDate(result.startDate)} – ${formatThaiDate(result.endDate)}`

  return (
    <SuccessScreen
      title="ส่งคำขอลาเรียบร้อย"
      description="คำขอถูกส่งไปยังผู้จัดการเพื่อพิจารณาอนุมัติ แล้วคุณจะได้รับการแจ้งเตือนเมื่อมีผล"
      action={
        <PrimaryButton shape="pill" icon={<HistoryIcon />} onClick={onBackToPending}>
          ดูประวัติการลา
        </PrimaryButton>
      }
    >
      <div className="rounded-card bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <LeaveTypeIcon type={result.type} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary-dark">{LEAVE_TYPE_LABEL[result.type]}</p>
            <p className="text-sm text-text-secondary">
              {result.totalDays} วัน · {result.periodSummary}
            </p>
            <p className="text-xs text-text-secondary">เลขที่ใบลา {result.requestNumber}</p>
          </div>
          <StatusBadge status={result.status} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-sm">
          <span className="text-text-secondary">วันที่ลา</span>
          <span className="font-semibold text-primary-dark">{dateLabel}</span>
        </div>
      </div>
    </SuccessScreen>
  )
}
