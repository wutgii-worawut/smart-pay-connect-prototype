/**
 * components/Calendar.tsx — ปฏิทินฐาน (hand-vendor จาก react-day-picker, architecture.md §10.1-10.3)
 * copy พฤติกรรมมา restyle ด้วย token เราตรง ๆ (ไม่ใช้ shadcn CLI ตามที่ผู้ใช้เคาะ P4/P7 — plan.md P7)
 * ไม่ import CSS ของ react-day-picker เลย (`react-day-picker/style.css`) — สไตล์ทั้งหมดมาจาก
 * `@theme` ผ่าน `classNames`/component override เท่านั้น ปลอดภัยกับ globals.css เหมือน Drawer/Dialog/Select
 *
 * Component นี้เป็น "ฐาน" ให้ feature ประกอบต่อ:
 * - `DateRangeField` ในไฟล์นี้ชุดเดียวกัน (P7, ช่วงวันที่ลา)
 * - `LeaveCalendar` (P18, feature calendar) — override `components.DayButton` เองเพื่อใส่จุดสีประเภทลา
 *   ใต้เลขวัน ตามโค้ดตัวอย่าง architecture §10.3 (ห่อ `DayButton` เดิมของ react-day-picker แบบเดียวกับ
 *   `CalendarDayButton` ด้านล่างเป็นตัวอย่าง แล้วส่งเข้า prop `components={{ DayButton: ... }}`
 *   — ค่าที่ส่งมาจะ "ชนะ" default ของเราเพราะ merge `...components` ทีหลังเสมอ)
 *
 * - locale ไทย (date-fns/locale th, weekStartsOn=0 ตามค่า default ของ locale th ตรง design อยู่แล้ว)
 * - custom `MonthCaption` แสดง พ.ศ. ("มิถุนายน" / "พ.ศ. 2569" คนละบรรทัด) + ปุ่ม ‹ › นำทางเดือนในแถวเดียวกัน
 *   (ปิด Nav เริ่มต้นของ react-day-picker ด้วย `hideNavigation` เพราะ design วางลูกศรแถวเดียวกับชื่อเดือน
 *   ไม่ใช่ลอยมุมขวาบนแบบ default — นำทางเองผ่าน `useDayPicker().goToMonth`)
 * - custom `DayButton` ค่าเริ่มต้น (เลขวันล้วน, วงเขียวตอนวันนี้/วันเลือก ตาม feature-plans/06 §6.1)
 * - `showOutsideDays=false` (ค่า default ของ react-day-picker อยู่แล้ว แต่ระบุชัดตรงกับ design
 *   ที่ไม่โชว์วันของเดือนอื่นในช่องว่างท้ายตาราง)
 *
 * `CalendarProps = DayPickerProps` ตรง ๆ (ไม่ตัดพร็อพเอง) — ให้ type ของ react-day-picker เองคุม
 * discriminated union ตาม `mode` ('single' | 'multiple' | 'range') ตอนเรียกใช้ (TS strict, ไม่มี `any`/`as`)
 */
import { DayPicker, DayButton as RdpDayButton, useDayPicker } from 'react-day-picker'
import type { DayButtonProps, DayPickerProps, MonthCaptionProps } from 'react-day-picker'
import { th } from 'date-fns/locale'
import { formatThaiMonthCaption } from '@/utils/date'

function ChevronLeftIcon() {
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
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function ChevronRightIcon() {
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
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

/** หัวปฏิทิน: ‹ เดือนไทย › แถวเดียว + "พ.ศ. YYYY" บรรทัดรอง (architecture §10.3, design 6.Calendar/1) */
function CalendarMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, previousMonth, nextMonth } = useDayPicker()
  const { month, yearBe } = formatThaiMonthCaption(calendarMonth.date)

  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        type="button"
        aria-label="เดือนก่อนหน้า"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="flex h-9 w-9 items-center justify-center rounded-card bg-surface text-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeftIcon />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-primary-dark">{month}</span>
        <span className="text-sm text-text-secondary">{yearBe}</span>
      </div>
      <button
        type="button"
        aria-label="เดือนถัดไป"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className="flex h-9 w-9 items-center justify-center rounded-card bg-surface text-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

/** ทรงปุ่มวันตามสถานะ — วันนี้/วันเลือก = วงเขียว (feature-plans/06 §6.1), แตะง่ายบนมือถือ ≥40px (h-10 w-10) */
function dayButtonClassName(modifiers: DayButtonProps['modifiers'], outside: boolean): string {
  const base =
    'flex h-10 w-10 items-center justify-center rounded-full text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed'

  if (modifiers.disabled) {
    return [base, 'text-text-secondary/50'].join(' ')
  }
  if (modifiers.range_start || modifiers.range_end) {
    return [base, 'bg-primary font-semibold text-white'].join(' ')
  }
  if (modifiers.range_middle) {
    return [base, 'rounded-none bg-primary/10 font-medium text-primary-dark'].join(' ')
  }
  if (modifiers.selected || modifiers.today) {
    return [base, 'border-2 border-success font-semibold text-primary-dark'].join(' ')
  }
  return [base, outside ? 'text-text-secondary/50' : 'text-primary-dark'].join(' ')
}

/**
 * ปุ่มวันค่าเริ่มต้น (เลขวันล้วน ไม่มีจุดสี) — ห่อ `DayButton` เดิมของ react-day-picker (ไม่ได้เขียน
 * `<button>` เอง) เพื่อคง behavior เดิมครบ (focus เมื่อ modifiers.focused, keyboard nav, click/blur
 * handlers ที่ react-day-picker ผูกมาให้ผ่าน props) ตามแนวโค้ดตัวอย่าง architecture §10.3 — แค่แทนที่
 * children ด้วย JSX ของเราเอง (children ที่ react-day-picker ส่งมาให้ผ่าน props เดิม = เลขวัน formatted
 * ถูกโยนทิ้งไปเพราะ JSX children ที่ระบุตรง ๆ ชนะเสมอ)
 */
function CalendarDayButton({ day, modifiers, ...props }: DayButtonProps) {
  return (
    <RdpDayButton
      {...props}
      day={day}
      modifiers={modifiers}
      className={dayButtonClassName(modifiers, day.outside)}
    >
      {day.date.getDate()}
    </RdpDayButton>
  )
}

export type CalendarProps = DayPickerProps

export function Calendar({ classNames, components, className, ...rest }: CalendarProps) {
  return (
    <DayPicker
      locale={th}
      showOutsideDays={false}
      hideNavigation
      className={['w-full', className].filter(Boolean).join(' ')}
      classNames={{
        months: 'w-full',
        month: 'w-full',
        month_grid: 'w-full border-collapse',
        weekdays: '',
        weekday: 'pb-2 text-center text-sm font-medium text-text-secondary',
        week: '',
        day: 'p-0.5 text-center align-middle',
        ...classNames,
      }}
      components={{
        MonthCaption: CalendarMonthCaption,
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...rest}
    />
  )
}
