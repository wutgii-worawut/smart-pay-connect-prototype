/**
 * features/calendar/components/HolidayDetails.tsx — Drawer รายละเอียดวันหยุด (P17, จอ 6.3
 * `6.Calendar/3.Holiday Details.png`) — presentational ล้วน รับ `holiday`+`open`+`onClose` จาก page
 * (page เป็นคนถือ state ว่ากำลังเปิดดูวันหยุดไหนอยู่)
 *
 * ใช้ข้อมูลจาก payload `GET /holidays?year=` เดิมได้เลย ไม่มี endpoint แยก (feature-plans/06 §6.3)
 * ไม่ใช้ `dismissible={false}` (กับดัก P6 #3 — ต้องปัดปิด/กดปุ่ม X ได้เสมอ), safe-area ผ่าน `Drawer` เอง
 */
import { Drawer } from '@/components/Drawer'
import { DetailField } from '@/components/DetailField'
import { GhostButton } from '@/components/GhostButton'
import { formatThaiDate } from '@/utils/date'
import type { Holiday, HolidayType } from '@/types/holiday'
import { HOLIDAY_TYPE_LABEL, formatThaiWeekday, splitHolidayDate } from '../utils/holidays'

interface HolidayDetailsProps {
  holiday: Holiday | null
  open: boolean
  onClose: () => void
}

const HOLIDAY_TYPE_CLASS: Record<HolidayType, { box: string; tag: string }> = {
  government: { box: 'bg-holiday-government', tag: 'bg-holiday-government/10 text-holiday-government' },
  religious: { box: 'bg-holiday-religious', tag: 'bg-holiday-religious/10 text-holiday-religious' },
  royal: { box: 'bg-holiday-royal', tag: 'bg-holiday-royal/10 text-holiday-royal' },
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function HolidayDetails({ holiday, open, onClose }: HolidayDetailsProps) {
  if (!holiday) return null

  const { day, monthShort } = splitHolidayDate(holiday.date)
  const weekday = formatThaiWeekday(holiday.date)
  const typeClass = HOLIDAY_TYPE_CLASS[holiday.type]

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="รายละเอียดวันหยุด"
    >
      <div className="flex flex-col gap-4 pt-2 pb-2">
        <div className="flex items-start gap-4">
          <div
            className={`flex shrink-0 flex-col items-center rounded-card px-4 py-3 text-white ${typeClass.box}`}
          >
            <span className="text-3xl font-bold leading-none">{day}</span>
            <span className="mt-1 text-sm">{monthShort}</span>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-xl font-bold text-primary-dark">{holiday.name}</h2>
            {holiday.nameEn ? (
              <p className="mt-1 text-sm text-text-secondary">{holiday.nameEn}</p>
            ) : null}
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${typeClass.tag}`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
            {HOLIDAY_TYPE_LABEL[holiday.type]}
          </span>
        </div>

        <div className="rounded-card bg-white shadow-card">
          <div className="px-4">
            <DetailField label="วันที่" value={formatThaiDate(holiday.date, 'd-MMMM-yyyy')} />
            <DetailField label="ตรงกับ" value={`วัน${weekday}`} />
            <DetailField label="ประเภท" value={HOLIDAY_TYPE_LABEL[holiday.type]} />
          </div>
        </div>

        {holiday.description ? (
          <div className="flex items-center gap-3 rounded-card bg-primary/10 px-4 py-3 text-sm text-primary-dark">
            <InfoIcon />
            <span>{holiday.description}</span>
          </div>
        ) : null}

        <GhostButton shape="pill" onClick={onClose}>
          ปิด
        </GhostButton>
      </div>
    </Drawer>
  )
}
