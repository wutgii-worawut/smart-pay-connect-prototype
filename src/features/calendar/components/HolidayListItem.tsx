/**
 * features/calendar/components/HolidayListItem.tsx — ห่อ `ListCard` (S6) รายการเดียวใน "รายการวันหยุด"
 * (P17, design `6.Calendar/2.Holidays.png`) — กล่องวันที่ย่อสีตามประเภท + ชื่อไทย + วันในสัปดาห์ + tag
 * ประเภท + ›  — presentational ล้วน รับ `holiday` + `onClick` จาก page
 */
import { ListCard } from '@/components/ListCard'
import type { Holiday, HolidayType } from '@/types/holiday'
import { HOLIDAY_TYPE_LABEL, formatThaiWeekday, splitHolidayDate } from '../utils/holidays'

interface HolidayListItemProps {
  holiday: Holiday
  onClick: () => void
}

/** คลาสสีตาม `--color-holiday-*` (code-style.md: ใช้ token ผ่าน Tailwind class เท่านั้น) */
const HOLIDAY_TYPE_CLASS: Record<HolidayType, { box: string; day: string; tag: string }> = {
  government: {
    box: 'bg-holiday-government/10',
    day: 'text-holiday-government',
    tag: 'bg-holiday-government/10 text-holiday-government',
  },
  religious: {
    box: 'bg-holiday-religious/10',
    day: 'text-holiday-religious',
    tag: 'bg-holiday-religious/10 text-holiday-religious',
  },
  royal: {
    box: 'bg-holiday-royal/10',
    day: 'text-holiday-royal',
    tag: 'bg-holiday-royal/10 text-holiday-royal',
  },
}

export function HolidayListItem({ holiday, onClick }: HolidayListItemProps) {
  const { day, monthShort } = splitHolidayDate(holiday.date)
  const weekday = formatThaiWeekday(holiday.date)
  const typeClass = HOLIDAY_TYPE_CLASS[holiday.type]

  return (
    <ListCard
      onClick={onClick}
      leading={
        <div
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-card ${typeClass.box}`}
        >
          <span className={`text-lg font-bold leading-none ${typeClass.day}`}>{day}</span>
          <span className="mt-0.5 text-xs text-text-secondary">{monthShort}</span>
        </div>
      }
      title={holiday.name}
      meta={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span>{weekday}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeClass.tag}`}>
            {HOLIDAY_TYPE_LABEL[holiday.type]}
          </span>
        </span>
      }
    />
  )
}
