/**
 * features/calendar/components/NextHolidayHero.tsx — การ์ดน้ำเงิน "วันหยุดถัดไป · อีก N วัน" (P17,
 * design `6.Calendar/2.Holidays.png`) — presentational ล้วน รับ `nextHoliday`/`daysUntil` ที่ page
 * derive มาแล้วจาก `getNextHoliday`/`daysUntil` (utils/holidays.ts) — ไม่ query/derive เองในนี้
 *
 * นับถอยหลัง "อีก N วัน" เป็นการแสดงผลล้วน ไม่มีผลทางธุรกรรม (feature-plans/06 §6.2)
 */
import { formatThaiWeekday, splitHolidayDate, HOLIDAY_TYPE_LABEL } from '../utils/holidays'
import type { Holiday } from '@/types/holiday'

interface NextHolidayHeroProps {
  nextHoliday: Holiday | null
  daysUntil: number
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

export function NextHolidayHero({ nextHoliday, daysUntil }: NextHolidayHeroProps) {
  if (!nextHoliday) return null

  const { day, monthShort } = splitHolidayDate(nextHoliday.date)
  const weekday = formatThaiWeekday(nextHoliday.date)
  const subtitle = nextHoliday.nameEn ? `วัน${weekday} · ${nextHoliday.nameEn}` : `วัน${weekday}`

  return (
    <div className="relative overflow-hidden rounded-card bg-primary p-5 text-white shadow-card">
      <div className="mb-4 flex items-center gap-2 text-sm text-white/80">
        <span className="h-2 w-2 shrink-0 rounded-full bg-white" aria-hidden="true" />
        <span>วันหยุดถัดไป · อีก {daysUntil} วัน</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center rounded-card bg-white/15 px-4 py-3">
          <span className="text-3xl font-bold leading-none">{day}</span>
          <span className="mt-1 text-sm">{monthShort}</span>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="text-xl font-bold">{nextHoliday.name}</h2>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-medium">
        <CalendarIcon />
        <span>{HOLIDAY_TYPE_LABEL[nextHoliday.type]}</span>
      </div>
    </div>
  )
}
