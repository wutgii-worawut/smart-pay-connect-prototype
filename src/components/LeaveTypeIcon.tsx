/**
 * components/LeaveTypeIcon.tsx — ไอคอนสี่เหลี่ยมมนต่อประเภทลา (S5, feature-plans/00 §1)
 * รูปเป็น PNG พื้นสีตัน (ไม่โปร่งใส) อยู่ที่ src/assets/leave/ — สีในไฟล์ตรงกับ --color-leave-*
 * (vacation=เขียว, sick=ส้มอิฐ, personal=ฟ้าเทา) อยู่แล้ว ไม่ต้อง overlay สีซ้ำ
 * reuse กับจุดปฏิทิน/legend ใน P18 (feature-plans/00 §1 S5)
 */
import leavePersonal from '@/assets/leave/leave-personal.png'
import leaveSick from '@/assets/leave/leave-sick.png'
import leaveVacation from '@/assets/leave/leave-vacation.png'
import type { LeaveType } from '@/types/leave'

interface LeaveTypeIconProps {
  type: LeaveType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ICON_SRC: Record<LeaveType, string> = {
  vacation: leaveVacation,
  sick: leaveSick,
  personal: leavePersonal,
}

const LABEL: Record<LeaveType, string> = {
  vacation: 'ลาพักร้อน',
  sick: 'ลาป่วย',
  personal: 'ลากิจ',
}

const SIZE_CLASS: Record<NonNullable<LeaveTypeIconProps['size']>, string> = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
}

export function LeaveTypeIcon({ type, size = 'md', className }: LeaveTypeIconProps) {
  return (
    <img
      src={ICON_SRC[type]}
      alt={LABEL[type]}
      className={[SIZE_CLASS[size], 'shrink-0 rounded-card object-cover', className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
