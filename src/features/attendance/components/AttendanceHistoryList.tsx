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
  // ไอคอนปฏิทิน หน้าประวัติ (Figma 2026-07-23) — currentColor = #434343
  return (
    <svg viewBox="0 0 45 50" fill="none" className="h-5 w-5 shrink-0 text-caption" aria-hidden="true">
      <path
        fill="currentColor"
        d="M40 5H37.5V0H32.5V5H12.5V0H7.5V5H5C2.225 5 0.025 7.25 0.025 10L0 45C0 47.75 2.225 50 5 50H40C42.75 50 45 47.75 45 45V10C45 7.25 42.75 5 40 5ZM40 45H5V20H40V45ZM40 15H5V10H40V15ZM15 30H10V25H15V30ZM25 30H20V25H25V30ZM35 30H30V25H35V30ZM15 40H10V35H15V40ZM25 40H20V35H25V40ZM35 40H30V35H35V40Z"
      />
    </svg>
  )
}

function LocationPinIcon() {
  // ไอคอนปักหมุด (Figma 2026-07-23) — currentColor = #434343
  return (
    <svg viewBox="0 0 40 50" fill="none" className="h-4 w-4 shrink-0 text-caption" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 25C17.25 25 15 22.75 15 20C15 17.25 17.25 15 20 15C22.75 15 25 17.25 25 20C25 22.75 22.75 25 20 25ZM35 20.5C35 11.425 28.375 5 20 5C11.625 5 5 11.425 5 20.5C5 26.35 9.875 34.1 20 43.35C30.125 34.1 35 26.35 35 20.5ZM20 0C30.5 0 40 8.05 40 20.5C40 28.8 33.325 38.625 20 50C6.675 38.625 0 28.8 0 20.5C0 8.05 9.5 0 20 0Z"
      />
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
