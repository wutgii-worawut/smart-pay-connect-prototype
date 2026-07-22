/**
 * components/LeaveRequestDetailCard.tsx — layout รายละเอียดใบลา (feature-plans/00 §2, D2 plan.md §1)
 * ใช้ร่วม Leave (P15 `owner-view`, `4.History Details.png` / `8. Sended Pending Details.png`) และ
 * Approval (P20 — `approver-action`/`approver-view`, ยังไม่ implement ในเฟสนี้)
 *
 * ⚠️ D2 hard rule: presentational ล้วน — ห้าม useQuery/useMutation/navigate ในไฟล์นี้ ข้อมูล+callback
 * มาจาก props เท่านั้น (page เป็นคนตัดสิน fetch/mutate/navigate ไปไหน)
 *
 * 🔴 §23.1#5 landmine: design (`8. Sended Pending Details.png`) มีปุ่ม "แก้ไขคำขอ" แต่การแก้ไขใบลา
 * เป็น Open Question ที่ยังไม่เคาะ (ไม่มี endpoint) — ผู้ใช้ตัดสินใจแล้วว่าให้ "คงปุ่มไว้ในหน้าตา
 * แต่ปิดใช้งานเสมอ" (disabled, ไม่มี onClick) ห้ามต่อ flow แก้ไขใด ๆ จนกว่าจะมีคำตอบ + endpoint
 */
import type { ReactNode } from 'react'
import { AttachmentItem } from './AttachmentItem'
import { BottomActionBar } from './BottomActionBar'
import { DangerSoftButton } from './DangerSoftButton'
import { DetailField } from './DetailField'
import { GhostButton } from './GhostButton'
import { LeaveTypeIcon } from './LeaveTypeIcon'
import { PrimaryButton } from './PrimaryButton'
import { StatusBadge } from './StatusBadge'
import { formatLeaveDayLine, formatThaiDate } from '@/utils/date'
import { LEAVE_TYPE_LABEL, LEAVE_TYPE_LABEL_EN } from '@/utils/leaveType'
import type { LeaveRequestDetail } from '@/types/leave'

/** ตอนนี้มีแค่มุมมองเจ้าของใบลา — Approval (P20) จะเพิ่ม 'approver-action' | 'approver-view' ทีหลัง */
export type LeaveRequestDetailCardMode = 'owner-view'

interface LeaveRequestDetailCardProps {
  detail: LeaveRequestDetail
  mode: LeaveRequestDetailCardMode
  /** สถานะอ่านอย่างเดียว (APPROVED/REJECTED/CANCELLED) → ปุ่ม "ปิด" */
  onClose?: () => void
  /** สถานะ PENDING → ปุ่ม "ยกเลิกคำขอ" */
  onCancel?: () => void
}

function CancelIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  )
}

function EditIcon() {
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
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}

function DailyBreakdown({ detail }: { detail: LeaveRequestDetail }) {
  // แสดง "รายละเอียดรายวัน" เฉพาะเมื่อหลายวันหรือมีวันครึ่งวันปนอยู่ (single full day ไม่ต้องแสดง
  // ซ้ำกับวันที่เริ่ม/สิ้นสุดด้านบน — ดู 4.History (multi-day) vs 8.Pending (single full day))
  const shouldShow = detail.days.length > 1 || detail.days.some((d) => d.period !== 'full')
  if (!shouldShow) return null

  return (
    <DetailField
      label="รายละเอียดรายวัน"
      value={
        <div className="flex flex-col gap-1">
          {detail.days.map((day) => (
            <span key={day.date}>{formatLeaveDayLine(day)}</span>
          ))}
        </div>
      }
    />
  )
}

export function LeaveRequestDetailCard({ detail, onClose, onCancel }: LeaveRequestDetailCardProps) {
  const isPending = detail.status === 'PENDING'

  const actionBar: ReactNode = isPending ? (
    <BottomActionBar
      secondary={
        <DangerSoftButton icon={<CancelIcon />} onClick={onCancel}>
          ยกเลิกคำขอ
        </DangerSoftButton>
      }
      primary={
        // §23.1#5: ไม่มี endpoint แก้ไขใบลา — ปุ่มคงไว้ตาม design แต่ปิดใช้งานเสมอ ไม่มี onClick
        <PrimaryButton icon={<EditIcon />} disabled>
          แก้ไขคำขอ
        </PrimaryButton>
      }
    />
  ) : (
    <BottomActionBar primary={<GhostButton onClick={onClose}>ปิด</GhostButton>} />
  )

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-32">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LeaveTypeIcon type={detail.type} size="md" />
            <div>
              <p className="text-lg font-semibold text-primary-dark">{LEAVE_TYPE_LABEL[detail.type]}</p>
              <p className="text-sm text-text-secondary">{LEAVE_TYPE_LABEL_EN[detail.type]}</p>
            </div>
          </div>
          <StatusBadge status={detail.status} />
        </div>

        <div className="mt-2">
          <DetailField label="เลขที่ใบลา" value={detail.requestNumber} />
          <DetailField label="วันที่เริ่ม" value={formatThaiDate(detail.startDate)} />
          <DetailField label="วันที่สิ้นสุด" value={formatThaiDate(detail.endDate)} />
          <DailyBreakdown detail={detail} />
          <DetailField
            label="จำนวนวัน"
            value={
              <span className="text-success">
                {detail.totalDays} วัน · {detail.periodSummary}
              </span>
            }
          />
          <DetailField label="เหตุผล" value={detail.reason} />
          <DetailField label="วันที่ส่งคำขอ" value={formatThaiDate(detail.submittedAt)} />
          <DetailField label="ผู้ปฏิบัติงานแทน" value={detail.proxyName} />
          <DetailField label="ผู้อนุมัติ" value={detail.approverName} />
          <DetailField
            label="วันที่อนุมัติ"
            value={detail.approvedAt ? formatThaiDate(detail.approvedAt) : '—'}
          />
        </div>

        <div className="pt-4">
          <p className="text-sm text-text-secondary">เอกสารแนบ</p>
          {detail.attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {detail.attachments.map((attachment) => (
                // owner-view = อ่านอย่างเดียวเสมอ (ไม่มี edit flow ต่อ §23.1#5) — ไม่ส่ง onRemove
                <AttachmentItem
                  key={attachment.id}
                  fileName={attachment.name}
                  fileSizeLabel={`ขนาด ${attachment.sizeLabel}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {actionBar}
    </div>
  )
}
