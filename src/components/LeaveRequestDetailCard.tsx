/**
 * components/LeaveRequestDetailCard.tsx — layout รายละเอียดใบลา (feature-plans/00 §2, D2 plan.md §1)
 * ใช้ร่วม Leave (P15 `owner-view`, `4.History Details.png` / `8. Sended Pending Details.png`) และ
 * Approval (P20 `approver-action`/`approver-view`, `2.Pending Details.png` / `5.History Details -
 * Approved.png` / `6.History Details - Read Only (All Done).png`)
 *
 * ⚠️ D2 hard rule: presentational ล้วน — ห้าม useQuery/useMutation/navigate/useState ในไฟล์นี้
 * ข้อมูล+callback มาจาก props เท่านั้น (page เป็นคนตัดสิน fetch/mutate/navigate/ถือ state comment ไปไหน)
 *
 * ⚠️ ปุ่มที่แสดงต้อง gate ด้วย **mode** ไม่ใช่ status ของ `detail` (กับดัก P15 #4) — ใบ PENDING ที่ page
 * ส่งมาเป็น mode `approver-action` ต้องไม่มีทางโผล่ปุ่ม "ยกเลิกคำขอ/แก้ไขคำขอ" ของฝั่งเจ้าของเด็ดขาด
 *
 * 🔴 §23.1#5 landmine: design (`8. Sended Pending Details.png`) มีปุ่ม "แก้ไขคำขอ" แต่การแก้ไขใบลา
 * เป็น Open Question ที่ยังไม่เคาะ (ไม่มี endpoint) — ผู้ใช้ตัดสินใจแล้วว่าให้ "คงปุ่มไว้ในหน้าตา
 * แต่ปิดใช้งานเสมอ" (disabled, ไม่มี onClick) ห้ามต่อ flow แก้ไขใด ๆ จนกว่าจะมีคำตอบ + endpoint
 *
 * 🔴 §23.1#6 landmine: design (`5.History Details - Approved.png`) มีปุ่ม "ยกเลิกคำขอ" (revoke ใบที่
 * อนุมัติไปแล้ว) — เป็น Open Question ที่ยังไม่เคาะเงื่อนไข/endpoint เช่นกัน (ยกเลิกได้ถึงเมื่อไหร่? คืน
 * โควตายังไง?) — prop `canRevoke` **default false เสมอ** ตอนนี้ไม่มี caller ไหนส่ง true จริง ถ้าวันหน้า
 * ส่ง true ปุ่มก็ยังต้อง disabled ไม่มี onClick เสมอ (มิเรอร์เทคนิคเดียวกับ "แก้ไขคำขอ" ด้านบน) —
 * ห้ามต่อ mutation/endpoint/status revoke ใด ๆ จนกว่าจะมีคำตอบ+endpoint
 */
import type { ChangeEvent, ReactNode } from 'react'
import { AttachmentItem } from './AttachmentItem'
import { BottomActionBar } from './BottomActionBar'
import { DangerSoftButton } from './DangerSoftButton'
import { DetailField } from './DetailField'
import { GhostButton } from './GhostButton'
import { LeaveTypeIcon } from './LeaveTypeIcon'
import { PrimaryButton } from './PrimaryButton'
import { StatusBadge } from './StatusBadge'
import { Textarea } from './Textarea'
import { TypeBanner } from './TypeBanner'
import { formatLeaveDayLine, formatThaiDate, formatThaiDateRange, formatThaiInstant } from '@/utils/date'
import { LEAVE_TYPE_LABEL, LEAVE_TYPE_LABEL_EN } from '@/utils/leaveType'
import type { LeaveAttachment, LeaveRequestDetail } from '@/types/leave'

export type LeaveRequestDetailCardMode = 'owner-view' | 'approver-action' | 'approver-view'

interface LeaveRequestDetailCardProps {
  detail: LeaveRequestDetail
  mode: LeaveRequestDetailCardMode
  /** owner-view (APPROVED/REJECTED/CANCELLED) หรือ approver-view (เสมอ) → ปุ่ม "ปิด" */
  onClose?: () => void
  /** owner-view PENDING → ปุ่ม "ยกเลิกคำขอ" */
  onCancel?: () => void
  /** approver-action: ค่าปัจจุบันของช่องความเห็นผู้อนุมัติ — controlled ผ่าน props (page ถือ state) */
  comment?: string
  onCommentChange?: (value: string) => void
  commentError?: string
  /** approver-action: กด "อนุมัติ" */
  onApprove?: () => void
  /** approver-action: กด "ไม่อนุมัติ" */
  onReject?: () => void
  /** approver-action: ระหว่าง mutation กำลังส่ง → ปุ่มอนุมัติ/ไม่อนุมัติ disabled กัน double submit */
  isSubmitting?: boolean
  /**
   * approver-view: แสดงปุ่ม "ยกเลิกคำขอ" (revoke) หรือไม่ — ดู landmine §23.1#6 ด้านบนไฟล์
   * default false เสมอ; แม้ true ปุ่มก็ยัง disabled ไม่มี onClick
   */
  canRevoke?: boolean
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

function ApproveIcon() {
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
      <path d="M8 12.5l2.5 2.5L16 9.5" />
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

function AttachmentsSection({ attachments }: { attachments: LeaveAttachment[] }) {
  return (
    <div className="pt-4">
      <p className="text-sm text-text-secondary">เอกสารแนบ</p>
      {attachments.length > 0 ? (
        <div className="mt-3 space-y-2">
          {attachments.map((attachment) => (
            // อ่านอย่างเดียวเสมอทั้ง owner-view (ไม่มี edit flow ต่อ §23.1#5) และ approver
            // (ยังไม่มี handler ดูไฟล์จริงจาก props ในเฟสนี้) — ไม่ส่ง onRemove/onView
            <AttachmentItem
              key={attachment.id}
              fileName={attachment.name}
              fileSizeLabel={`ขนาด ${attachment.sizeLabel}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function OwnerHeader({ detail }: { detail: LeaveRequestDetail }) {
  return (
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
  )
}

/** header ฝั่ง Approval (approver-action/approver-view) — ชื่อพนักงาน + วันที่ส่งคำขอ แทนชื่อประเภทลา
 * (ประเภทลาย้ายไปอยู่ TypeBanner ด้านล่างแทน ตาม design `2.Pending Details.png`) */
function ApproverHeader({ detail }: { detail: LeaveRequestDetail }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <LeaveTypeIcon type={detail.type} size="md" />
        <div>
          <p className="text-lg font-semibold text-primary-dark">{detail.employeeName}</p>
          <p className="text-sm text-text-secondary">ส่งคำขอเมื่อ {formatThaiInstant(detail.submittedAt)}</p>
        </div>
      </div>
      <StatusBadge status={detail.status} />
    </div>
  )
}

/** field กลุ่มฝั่ง Approval (ใช้ร่วมทั้ง approver-action/approver-view) ตามลำดับ design `2.Pending
 * Details.png`: TypeBanner → วันที่ลา → เหตุผล → วันลาคงเหลือ → เอกสารแนบ → ผู้ปฏิบัติงานแทน → ผู้อนุมัติ */
function ApproverFields({ detail }: { detail: LeaveRequestDetail }) {
  return (
    <>
      <TypeBanner
        typeLabel={LEAVE_TYPE_LABEL[detail.type]}
        summary={`${detail.totalDays} วัน · ${detail.periodSummary}`}
        className="mt-4"
      />
      <div className="mt-2">
        <DetailField label="วันที่ลา" value={formatThaiDateRange(detail.startDate, detail.endDate)} />
        <DailyBreakdown detail={detail} />
        <DetailField label="เหตุผล" value={detail.reason} />
        <DetailField
          label="วันลาคงเหลือ"
          value={
            detail.remainingBalance !== undefined ? (
              <span className="text-success">{detail.remainingBalance} วัน</span>
            ) : (
              '—'
            )
          }
        />
      </div>
      <AttachmentsSection attachments={detail.attachments} />
      <div className="mt-2">
        <DetailField label="ผู้ปฏิบัติงานแทน" value={detail.proxyName} />
        <DetailField label="ผู้อนุมัติ" value={detail.approverName} />
      </div>
    </>
  )
}

interface ActionBarArgs {
  mode: LeaveRequestDetailCardMode
  detail: LeaveRequestDetail
  onClose?: () => void
  onCancel?: () => void
  onApprove?: () => void
  onReject?: () => void
  isSubmitting: boolean
  canRevoke: boolean
}

function renderActionBar({
  mode,
  detail,
  onClose,
  onCancel,
  onApprove,
  onReject,
  isSubmitting,
  canRevoke,
}: ActionBarArgs): ReactNode {
  if (mode === 'approver-action') {
    return (
      <BottomActionBar
        secondary={
          <DangerSoftButton icon={<CancelIcon />} onClick={onReject} isPending={isSubmitting}>
            ไม่อนุมัติ
          </DangerSoftButton>
        }
        primary={
          <PrimaryButton icon={<ApproveIcon />} onClick={onApprove} isPending={isSubmitting}>
            อนุมัติ
          </PrimaryButton>
        }
      />
    )
  }

  if (mode === 'approver-view') {
    return (
      <BottomActionBar
        primary={<GhostButton onClick={onClose}>ปิด</GhostButton>}
        secondary={
          canRevoke ? (
            // ดู landmine §23.1#6 หัวไฟล์ — คงปุ่มไว้ตามหน้าตา design แต่ปิดใช้งานเสมอ ไม่มี onClick
            <DangerSoftButton icon={<CancelIcon />} disabled>
              ยกเลิกคำขอ
            </DangerSoftButton>
          ) : undefined
        }
      />
    )
  }

  // owner-view — ปุ่มจาก status (PENDING → ยกเลิก/แก้ไข, อื่น ๆ → ปิด)
  const isPending = detail.status === 'PENDING'
  return isPending ? (
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
}

export function LeaveRequestDetailCard({
  detail,
  mode,
  onClose,
  onCancel,
  comment,
  onCommentChange,
  commentError,
  onApprove,
  onReject,
  isSubmitting = false,
  canRevoke = false,
}: LeaveRequestDetailCardProps) {
  const isApproverMode = mode === 'approver-action' || mode === 'approver-view'

  function handleCommentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onCommentChange?.(event.target.value)
  }

  const actionBar = renderActionBar({
    mode,
    detail,
    onClose,
    onCancel,
    onApprove,
    onReject,
    isSubmitting,
    canRevoke,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {isApproverMode ? <ApproverHeader detail={detail} /> : <OwnerHeader detail={detail} />}

        {isApproverMode ? (
          <>
            <ApproverFields detail={detail} />
            {mode === 'approver-action' ? (
              <div className="pt-4">
                <Textarea
                  id="approver-comment"
                  label="ความเห็นผู้อนุมัติ (ถ้ามี)"
                  placeholder="เช่น อนุมัติ แต่ฝากงานให้เรียบร้อยก่อน"
                  rows={3}
                  value={comment ?? ''}
                  onChange={handleCommentChange}
                  error={commentError}
                />
              </div>
            ) : detail.approverComment ? (
              <div className="mt-2">
                <DetailField label="ความเห็นผู้อนุมัติ" value={detail.approverComment} />
              </div>
            ) : null}
          </>
        ) : (
          <>
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
              <DetailField label="วันที่ส่งคำขอ" value={formatThaiInstant(detail.submittedAt)} />
              <DetailField label="ผู้ปฏิบัติงานแทน" value={detail.proxyName} />
              <DetailField label="ผู้อนุมัติ" value={detail.approverName} />
              <DetailField
                label="วันที่อนุมัติ"
                value={detail.approvedAt ? formatThaiInstant(detail.approvedAt) : '—'}
              />
            </div>
            <AttachmentsSection attachments={detail.attachments} />
          </>
        )}
      </div>

      {actionBar}
    </div>
  )
}
