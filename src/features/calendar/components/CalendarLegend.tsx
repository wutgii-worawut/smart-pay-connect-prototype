/**
 * features/calendar/components/CalendarLegend.tsx — แถว legend ใต้ปฏิทิน (P18, design
 * `6.Calendar/1.Leave Calendar.png`): ● ลาพักร้อน ● ลาป่วย ● ลากิจ — presentational ล้วน ไม่มี props
 * (ชุดประเภทลาคงที่ 3 ตัวเสมอ ต่างจาก legend ของ payroll/holiday ที่ผันตามข้อมูล)
 */
import type { LeaveType } from '@/types/leave'
import { LEAVE_TYPE_LABEL } from '@/utils/leaveType'

/** สีจุด token `--color-leave-*` ชุดเดียวกับ `LeaveCalendar`/`LeaveTypeIcon` (code-style.md) */
const DOT_COLOR: Record<LeaveType, string> = {
  vacation: 'bg-leave-vacation',
  sick: 'bg-leave-sick',
  personal: 'bg-leave-personal',
}

const LEGEND_TYPES: LeaveType[] = ['vacation', 'sick', 'personal']

export function CalendarLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-dashed border-primary/15 pt-4 text-sm text-text-secondary">
      {LEGEND_TYPES.map((type) => (
        <span key={type} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${DOT_COLOR[type]}`} aria-hidden="true" />
          {LEAVE_TYPE_LABEL[type]}
        </span>
      ))}
    </div>
  )
}
