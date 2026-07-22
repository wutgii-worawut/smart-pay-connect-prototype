/**
 * features/attendance/components/AttendanceHistoryList.tsx — รายการประวัติลงเวลาแบบไทม์ไลน์
 * (จอ `10.History.png`, feature-plans/02) — จัดกลุ่มตามวัน แต่ละวันมีจุดสีน้ำเงิน+เส้นเชื่อม
 * ต่อด้วยแถวเวลาเข้า/ออก (badge สีตามสถานะที่ server ตัดสิน + ไอคอนหมุด + ชื่อสถานที่)
 *
 * Presentational ล้วน — ไม่ fetch/ไม่ตัดสิน logic ใด ๆ เอง (มาสาย/ปกติ มาจาก `entry.status` ที่ server
 * ส่งมาแล้วเท่านั้น ดู CONTRACT FLAG ที่ types/attendance.ts)
 */
import { formatThaiDate } from '@/utils/date'
import type { AttendanceEntryStatus, AttendanceHistoryDay } from '../types/attendance'

interface AttendanceHistoryListProps {
  days: AttendanceHistoryDay[]
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
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function LocationPinIcon() {
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
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

/** ป้ายกำกับ+สีของ badge เวลา — "มาสาย"/"ปกติ" มาจาก server (`entry.status`) เท่านั้น ห้าม derive เอง */
const STATUS_CONFIG: Record<AttendanceEntryStatus, { label: string; className: string }> = {
  late: { label: 'มาสาย', className: 'bg-danger' },
  normal: { label: 'ปกติ', className: 'bg-success' },
}

function TimeBadge({ time, status }: { time: string; status: AttendanceEntryStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white',
        config.className,
      ].join(' ')}
    >
      {time}
      {/* ไม่พึ่งสีอย่างเดียวบอกสถานะ (a11y) — ข้อความ "มาสาย"/"ปกติ" อยู่ใน DOM จริง แค่ซ่อนจากตาเห็น */}
      <span className="sr-only"> ({config.label})</span>
    </span>
  )
}

export function AttendanceHistoryList({ days }: AttendanceHistoryListProps) {
  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.date}>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-primary-dark">
            <CalendarIcon />
            {formatThaiDate(day.date, 'd-MMMM-yyyy')}
          </h3>
          <div>
            {day.entries.map((entry, index) => (
              <div key={`${entry.direction}-${entry.time}-${index}`} className="flex items-stretch gap-3">
                <div className="flex w-3 shrink-0 flex-col items-center">
                  <span className="mt-3 h-3 w-3 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {index < day.entries.length - 1 ? (
                    <span className="w-0.5 flex-1 bg-primary" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex items-center gap-3 rounded-full border border-primary/15 bg-white px-3 py-2 shadow-card">
                    <TimeBadge time={entry.time} status={entry.status} />
                    <LocationPinIcon />
                    <span className="truncate text-sm text-primary-dark">{entry.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
