/**
 * features/calendar/components/LeaveCalendar.tsx — จอ 6.1 Leave Calendar (P18, architecture §10.3
 * case study, feature-plans/06 §6.1) ห่อ `@/components/Calendar` (base P7) ด้วย custom `DayButton`
 * แสดง "เลขวัน + แถวจุดสีใต้เลข" ตามประเภทลาของวันนั้น (≤3 จุด — `LeaveType` มีแค่ 3 ค่าอยู่แล้ว)
 *
 * 🔴 กับดัก P7 บันทึกแก้แผน #1 (ห้ามพลาดซ้ำ): demo jsx ใน architecture §10.3 เขียน
 * `components={{ DayButton: (props) => <LeaveDayButton {...props} leaveMap={leaveMap} /> }}` ซึ่งเป็น
 * inline arrow — identity ไม่นิ่ง → react-day-picker มองว่าเป็น component คนละตัวทุก render → remount
 * ทั้ง grid (focus หลุด + perf พัง) วิธีถูกคือส่ง `leaveMap` ผ่าน Context แทน parameter เพื่อให้
 * `LeaveDayButton` เป็น component ระดับ module (ประกาศนอก render, reference นิ่งตลอดอายุแอป) แล้วส่ง
 * `components={{ DayButton: LeaveDayButton }}` ตรง ๆ (ไม่ห่อ arrow) — อ่าน leaveMap ผ่าน `useContext`
 *
 * mode="single" + `required` เสมอ (ต่างจาก DateRangeField ที่ปล่อย optional) — ป้องกันปัญหา UX ที่กด
 * วันที่เลือกอยู่แล้วซ้ำแล้ว react-day-picker จะ toggle ค่าเป็น undefined (`useSingle` ของ react-day-picker,
 * ดู `node_modules/react-day-picker/dist/esm/selection/useSingle.js`) ซึ่งจะทำให้ detail section หายไป
 * ทั้งที่ผู้ใช้แค่กดวันเดิมซ้ำ — container (`LeaveCalendarView`) จึงมี `selectedDate` เป็น string เสมอ
 * ไม่ใช่ nullable (ค่าเริ่มต้น = วันนี้)
 *
 * เสาร์-อาทิตย์เลขสีเทา (`text-text-secondary`) — เช็คตรงจาก `day.date` ด้วย `isWeekend` (date-fns) ไม่ต้อง
 * ผ่าน modifiers prop เพิ่ม เพราะ react-day-picker ส่ง `day.date` (Date จริงของวันนั้น) มาให้ในทุกกรณีอยู่แล้ว
 * — base `Calendar.tsx` ยังไม่ทำสีนี้ (ใช้แค่ที่นี่ ไม่แก้ base เพราะ base ใช้ร่วมกับ DateRangeField/ฟอร์มลา
 * ที่ไม่มี concept นี้)
 */
import { createContext, useContext } from 'react'
import { format, isWeekend } from 'date-fns'
import { DayButton as RdpDayButton } from 'react-day-picker'
import type { DayButtonProps } from 'react-day-picker'
import { Calendar } from '@/components/Calendar'
import type { LeaveType } from '@/types/leave'
import type { LeaveMap } from '../types/leaveCalendar'

const LeaveMapContext = createContext<LeaveMap>({})

/** สีจุดตามประเภทลา — token `--color-leave-*` เดียวกับ `LeaveTypeIcon`/legend ทุกที่ (code-style.md) */
const DOT_COLOR: Record<LeaveType, string> = {
  vacation: 'bg-leave-vacation',
  sick: 'bg-leave-sick',
  personal: 'bg-leave-personal',
}

/** ทรงปุ่มวัน: วงเขียวตอนวันนี้/วันเลือก (เหมือน base), เสาร์-อาทิตย์เลขเทา, เดินคอลัมน์ (เลข+จุด) */
function leaveDayButtonClassName(
  modifiers: DayButtonProps['modifiers'],
  outside: boolean,
  weekend: boolean,
): string {
  const base =
    'flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-full text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed'

  if (modifiers.disabled) {
    return [base, 'text-text-secondary/50'].join(' ')
  }
  if (modifiers.selected || modifiers.today) {
    return [base, 'border-2 border-success font-semibold text-primary-dark'].join(' ')
  }
  if (outside) {
    return [base, 'text-text-secondary/50'].join(' ')
  }
  if (weekend) {
    return [base, 'text-text-secondary'].join(' ')
  }
  return [base, 'text-primary-dark'].join(' ')
}

/**
 * ปุ่มวันของ LeaveCalendar — component ระดับ module (ไม่ inline) อ่าน `leaveMap` ผ่าน Context (ดูกับดัก
 * ด้านบน) ห่อ `RdpDayButton` เดิมของ react-day-picker (ไม่เขียน `<button>` เอง) เพื่อคง behavior/focus/
 * keyboard nav ครบเหมือน `CalendarDayButton` ใน base — แทนที่แค่ children ด้วยเลขวัน + แถวจุดสี
 */
function LeaveDayButton({ day, modifiers, ...props }: DayButtonProps) {
  const leaveMap = useContext(LeaveMapContext)
  const types = leaveMap[format(day.date, 'yyyy-MM-dd')] ?? []
  const weekend = isWeekend(day.date)

  return (
    <RdpDayButton
      {...props}
      day={day}
      modifiers={modifiers}
      className={leaveDayButtonClassName(modifiers, day.outside, weekend)}
    >
      <span>{day.date.getDate()}</span>
      <span className="flex h-1.5 gap-0.5" aria-hidden="true">
        {types.map((type) => (
          <span key={type} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[type]}`} />
        ))}
      </span>
    </RdpDayButton>
  )
}

interface LeaveCalendarProps {
  leaveMap: LeaveMap
  month: Date
  onMonthChange: (month: Date) => void
  selected: Date
  onSelectDay: (date: Date) => void
}

export function LeaveCalendar({
  leaveMap,
  month,
  onMonthChange,
  selected,
  onSelectDay,
}: LeaveCalendarProps) {
  return (
    <LeaveMapContext value={leaveMap}>
      <Calendar
        mode="single"
        required
        month={month}
        onMonthChange={onMonthChange}
        selected={selected}
        onSelect={onSelectDay}
        components={{ DayButton: LeaveDayButton }}
      />
    </LeaveMapContext>
  )
}
