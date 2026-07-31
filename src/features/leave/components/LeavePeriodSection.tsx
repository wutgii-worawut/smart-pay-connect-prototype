/**
 * features/leave/components/LeavePeriodSection.tsx — "ช่วงเวลา" ใต้ `DateRangeField` (จอ 6.1/6.2 §2,
 * P16) วันเดียว (start===end) → `PeriodToggle` เดี่ยว (default variant); หลายวัน → แถวต่อวันจาก
 * `listLeaveCalendarDays` (utils/date.ts) — วันหยุด/เสาร์-อาทิตย์กลางช่วงเป็นแถว disabled "วันหยุด"
 * ไม่มี toggle และไม่นับในผลรวม
 *
 * ⚠️ **CRITICAL trap** (progress.md P1 #4): mockup `6.2.Create Request (more 1 days).png` วาดช่วง
 * 18→21 มิ.ย. 2569 แต่แถวรายวันในภาพตกวันเริ่ม (18) ไปเอง เหลือแค่ 19/20/21 — เป็น **ข้อผิดพลาดของ
 * mockup** ไม่ใช่กติกาจริง เรายึดกติกาวันทำงาน §4.1 ผ่าน `listLeaveCalendarDays` ที่รวมวันเริ่มเสมอ
 * (ไม่ตัดทิ้งตามภาพ) — ห้ามลอกพฤติกรรมที่เห็นใน mockup
 *
 * cross-field validation ทั้งหมด (ต้องเลือกช่วงวันที่/end>=start/span<=31 วัน/ครบทุกวันทำงาน) อยู่ที่
 * Zod schema ใน `LeaveForm.tsx` แล้วผูก error เข้าที่ `dateRange` (โชว์ผ่าน `DateRangeField`) —
 * component นี้จึงไม่มี prop error ของตัวเอง
 */
import { formatThaiDate, listLeaveCalendarDays, sumLeaveDays } from '@/utils/date'
import { PeriodToggle } from '@/components/PeriodToggle'
import type { DateRangeValue } from '@/utils/dateRange'
import type { LeaveDayEntry, LeaveDayPeriod } from '@/types/leave'

interface LeavePeriodSectionProps {
  dateRange: DateRangeValue | null
  days: LeaveDayEntry[]
  holidays: string[]
  onDaysChange: (days: LeaveDayEntry[]) => void
  /** วันลาคงเหลือ (โดยประมาณ) ของประเภทลาที่เลือกอยู่ — ใช้แค่โชว์คำเตือน preview ไม่บล็อกการส่งฟอร์ม
   * (โควตาจริงเป็นหน้าที่ backend เท่านั้น §7.5) `undefined` = ยังไม่รู้ค่า (ยังไม่เลือกประเภท/โหลด
   * balance ไม่มา) → ไม่โชว์เตือน */
  remaining: number | undefined
}

function CalendarDotIcon() {
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
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function LeavePeriodSection({
  dateRange,
  days,
  holidays,
  onDaysChange,
  remaining,
}: LeavePeriodSectionProps) {
  if (!dateRange) return null

  const calendarDays = listLeaveCalendarDays(dateRange.start, dateRange.end, holidays)
  const isSingleDay = dateRange.start === dateRange.end
  const totalDays = sumLeaveDays(days)
  // [ผู้ใช้เคาะ 2026-07-31] เตือน preview เมื่อยอดรวมเกินคงเหลือ — ไม่มีองค์ประกอบนี้ใน design PNG
  // 6.1/6.2 ต้นฉบับ เป็น deviation ที่ตั้งใจเพิ่มตามคำสั่งผู้ใช้ (ไม่ใช่ error, ไม่บล็อกการส่งฟอร์ม —
  // โควตาจริงยังเป็นหน้าที่ backend เท่านั้น ตาม §7.5) เก็บเป็นจำนวนวันที่เกิน (0 = ไม่เกิน/ไม่รู้ค่า
  // remaining) แทน boolean เพื่อให้ TS แคบชนิด `remaining` ไม่ได้ยังใช้แสดงผลตัวเลขต่อได้โดยไม่ต้อง `!`
  const excessDays = remaining !== undefined ? Math.max(0, totalDays - remaining) : 0
  // [ผู้ใช้เคาะ 2026-07-31 รอบเทสจริง] เปลี่ยนสีข้อความเป็น text-danger (เดิมเลือก text-warning ตอน
  // 2026-07-31 รอบแรกเพื่อแยกจาก error จริง — ผู้ใช้เทสจริงแล้วขอเปลี่ยนเป็นสีแดงแทน) ยังเป็น preview
  // เตือนเหมือนเดิมทุกอย่าง (ไม่บล็อก submit, ไม่มี role="alert"/aria-invalid)

  function handlePeriodChange(date: string, period: LeaveDayPeriod) {
    onDaysChange(days.map((d) => (d.date === date ? { ...d, period } : d)))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-primary-dark">ช่วงเวลา</h2>

      {isSingleDay ? (
        days[0] ? (
          <PeriodToggle
            value={days[0].period}
            onChange={(period) => handlePeriodChange(days[0].date, period)}
            ariaLabel={`ช่วงเวลาวันที่ ${formatThaiDate(days[0].date)}`}
          />
        ) : null
      ) : (
        <div className="flex flex-col gap-2">
          {calendarDays.map((day) => {
            if (!day.isWorkingDay) {
              return (
                <div
                  key={day.date}
                  className="flex items-center gap-3 rounded-card bg-surface px-4 py-3 text-text-secondary"
                >
                  <CalendarDotIcon />
                  <span className="flex-1 text-sm">{formatThaiDate(day.date)}</span>
                  <span className="text-sm">วันหยุด</span>
                </div>
              )
            }

            const entry = days.find((d) => d.date === day.date)
            if (!entry) return null

            return (
              <div
                key={day.date}
                className="flex items-center gap-3 rounded-card border border-primary/10 bg-white px-4 py-3"
              >
                <CalendarDotIcon />
                <span className="flex-1 text-sm text-primary-dark">{formatThaiDate(day.date)}</span>
                <PeriodToggle
                  variant="compact"
                  value={entry.period}
                  onChange={(period) => handlePeriodChange(day.date, period)}
                  ariaLabel={`ช่วงเวลาวันที่ ${formatThaiDate(day.date)}`}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between rounded-card bg-success/10 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-success">
          <ClockIcon /> รวมจำนวนวันลา
        </span>
        <span className="text-lg font-bold text-success">
          {totalDays} <span className="text-sm font-normal">วัน</span>
        </span>
      </div>

      {/* [ผู้ใช้เคาะ 2026-07-31] คำเตือน preview ไม่ใช่ error — ไม่มี role="alert"/aria-invalid ตั้งใจ
          เพราะไม่บล็อกการส่ง ยังกดปุ่มส่งคำขอลาได้ปกติ */}
      {excessDays > 0 ? (
        <p className="text-sm text-danger">เกินวันลาคงเหลือ (โดยประมาณ) {excessDays} วัน</p>
      ) : null}
    </div>
  )
}
