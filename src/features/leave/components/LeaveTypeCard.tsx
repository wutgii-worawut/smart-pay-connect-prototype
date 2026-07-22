/**
 * features/leave/components/LeaveTypeCard.tsx — การ์ดเลือกประเภทลา (จอ 6.1/6.2 §1, P16) พฤติกรรมเป็น
 * radio (เลือกได้ทีละใบในกลุ่ม) แต่ทรงเป็นการ์ดใหญ่ตาม design ไม่ใช่ radio ปกติ — 3 ใบ (LeaveForm
 * ห่อด้วย role="radiogroup" อีกชั้น)
 *
 * "คงเหลือ" เป็นตัวเลขคาดการณ์ (server คำนวณ ไม่ใช่ frontend derive) — ต้องมี label "(โดยประมาณ)"
 * กำกับตามกฎ §7.4/code-style.md เสมอ (PNG 6.1/6.2 เขียนแค่ "คงเหลือ N วัน" ไม่มีคำนี้ — เหมือน
 * precedent ที่ `LeaveBalanceCard.tsx` (P14) ต่อท้ายคำนี้เพิ่มจาก PNG เช่นกัน)
 */
import { LeaveTypeIcon } from '@/components/LeaveTypeIcon'
import { LEAVE_TYPE_LABEL, LEAVE_TYPE_LABEL_EN } from '@/utils/leaveType'
import type { LeaveType } from '@/types/leave'

interface LeaveTypeCardProps {
  type: LeaveType
  /** คงเหลือ (โดยประมาณ, จาก GET /leave/balance) — undefined ระหว่างโหลด/ไม่พบ */
  remaining: number | undefined
  selected: boolean
  onSelect: () => void
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function LeaveTypeCard({ type, remaining, selected, onSelect }: LeaveTypeCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        'flex w-full items-center gap-4 rounded-card border bg-white p-4 text-left transition-colors',
        selected ? 'border-success' : 'border-primary/10',
      ].join(' ')}
    >
      <LeaveTypeIcon type={type} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary-dark">{LEAVE_TYPE_LABEL[type]}</p>
        <p className="text-sm text-text-secondary">
          {LEAVE_TYPE_LABEL_EN[type]} · คงเหลือ (โดยประมาณ) {remaining ?? '-'} วัน
        </p>
      </div>
      <span
        aria-hidden="true"
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-success bg-success' : 'border-primary/20 bg-white',
        ].join(' ')}
      >
        {selected ? <CheckIcon /> : null}
      </span>
    </button>
  )
}
