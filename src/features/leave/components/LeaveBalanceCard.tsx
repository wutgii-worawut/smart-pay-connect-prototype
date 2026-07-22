/**
 * features/leave/components/LeaveBalanceCard.tsx — การ์ดโควตาวันลาต่อประเภท (จอ `1.Balance.png`, P14)
 * feature component (รู้ business "โควตาวันลา") ต่างจาก `LeaveRequestCard` ที่เป็น shared — การ์ดนี้
 * ใช้เฉพาะหน้า balance ของ leave เท่านั้น presentational ล้วน รับ `LeaveBalance` มาแสดงตรง ๆ ไม่คำนวณเงิน/โควตาเอง
 *
 * ⚠️ [Figma pass, code-style §7.4] PNG `1.Balance.png` เขียนแค่ "คงเหลือ" — แต่กติกา "ตัวเลขคาดการณ์
 * ต้อง label (โดยประมาณ)" (code-style.md, feature-plans/03 §3.1) บังคับให้ต่อท้าย เลยใช้
 * "คงเหลือ (โดยประมาณ)" สองบรรทัดเล็กใต้ตัวเลข ไม่ตรง PNG เป๊ะ แต่ตรงกฎ
 */
import { LeaveTypeIcon } from '@/components/LeaveTypeIcon'
import { LEAVE_TYPE_LABEL } from '@/utils/leaveType'
import type { LeaveBalance, LeaveType } from '@/types/leave'

interface LeaveBalanceCardProps {
  balance: LeaveBalance
}

const PROGRESS_BG_CLASS: Record<LeaveType, string> = {
  vacation: 'bg-leave-vacation',
  sick: 'bg-leave-sick',
  personal: 'bg-leave-personal',
}

const REMAINING_TEXT_CLASS: Record<LeaveType, string> = {
  vacation: 'text-leave-vacation',
  sick: 'text-leave-sick',
  personal: 'text-leave-personal',
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const { type, total, carriedOver, used, pending, remaining } = balance
  // preview เท่านั้น (ตัวเลขจริงมาจาก server ทั้งก้อน) — กันหารด้วยศูนย์
  const usedPercent = total > 0 ? Math.min(100, (used / total) * 100) : 0

  return (
    <div className="rounded-card bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <LeaveTypeIcon type={type} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-primary-dark">{LEAVE_TYPE_LABEL[type]}</div>
              <div className="text-sm text-text-secondary">
                ได้รับ {total} วัน{carriedOver > 0 ? ` · ยกมา ${carriedOver} วัน` : ''}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={['text-2xl font-bold', REMAINING_TEXT_CLASS[type]].join(' ')}>
                <span>{remaining}</span> <span className="text-sm font-normal">วัน</span>
              </div>
              <div className="text-xs text-text-secondary">
                คงเหลือ
                <span className="block">(โดยประมาณ)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className={['h-full rounded-full', PROGRESS_BG_CLASS[type]].join(' ')}
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-sm">
            <span className="text-text-secondary">
              ใช้ไป <span className="font-semibold text-primary-dark">{used}</span> วัน
            </span>
            {pending > 0 ? (
              <span className="font-medium text-warning">อยู่ระหว่างรออนุมัติลา {pending} วัน</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
