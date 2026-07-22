/**
 * features/calendar/components/LeaveDayDetailSection.tsx — "ชั้นรายละเอียด" ของจอ 6.1 (P18,
 * architecture §10.3) แสดงใต้การ์ดปฏิทิน
 *
 * ตัดสินใจนอก spec เอกสาร (ผู้ใช้เคาะแล้ว — feature-plans/06 §6.1 เขียนว่า "เปิด Drawer" แต่ design PNG
 * จริง (`1.Leave Calendar.png`) วาดเป็น section inline ใต้การ์ดปฏิทินเลย ไม่มี bottom sheet) — ยึดตาม PNG
 * เพราะเป็นแหล่งที่แม่นกว่าตอน design กับ text ของ plan ขัดกัน ผู้ใช้ยืนยันแนวทางนี้ก่อนเริ่ม P18
 *
 * presentational ล้วน — ไม่มี useQuery/business logic (container `LeaveCalendarView` เป็นคนถือ query,
 * ส่ง `onRetry` ที่ผูกกับ `detailQuery.refetch()` ลงมา)
 * แสดงเฉพาะชื่อ + ป้ายประเภทลา (ไม่โชว์ `period` ตรง ๆ ตาม PNG ที่มีแต่ชื่อ+ประเภท ไม่มีบรรทัด
 * ช่วงเวลา — `period` ยังอยู่ใน type เผื่อ backend/design เพิ่ม UI แสดงภายหลัง)
 *
 * consultant review (M1, หลัง P18): error path เดิม dead-end (ไม่มีปุ่มลองใหม่ ผิดกฎ query error →
 * `<ErrorState retry>` ของ CLAUDE.md §16/§20) — กด "วันเดิม" ซ้ำไม่ refetch เพราะ `mode="single" required`
 * ไม่เปลี่ยน state → เพิ่ม `onRetry` ผูกกับ `<ErrorState>` ตรงนี้ + หัวข้อไม่โชว์ "(ลา 0 คน)" ปลอมระหว่าง
 * loading/error อีกต่อไป (ซ่อนวงเล็บจำนวนคนจนกว่าจะโหลดสำเร็จจริง)
 */
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { formatThaiDate } from '@/utils/date'
import { LEAVE_TYPE_LABEL } from '@/utils/leaveType'
import type { LeaveDayDetailEntry } from '../types/leaveCalendar'

interface LeaveDayDetailSectionProps {
  /** วันที่ที่เลือก 'YYYY-MM-DD' — `null` = ยังไม่เลือกวัน (ไม่ render อะไรเลย) */
  date: string | null
  entries: LeaveDayDetailEntry[]
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

export function LeaveDayDetailSection({
  date,
  entries,
  isLoading,
  isError,
  onRetry,
}: LeaveDayDetailSectionProps) {
  if (!date) return null

  const showCount = !isLoading && !isError

  return (
    <div>
      <h2 className="mb-3 text-base font-bold text-primary-dark">
        วันที่ {formatThaiDate(date, 'd-MMMM-yyyy')}
        {showCount ? ` (ลา ${entries.length} คน)` : ''}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-6 w-6 border-primary" />
        </div>
      ) : isError ? (
        <ErrorState message="โหลดรายละเอียดวันที่นี้ไม่สำเร็จ" onRetry={onRetry} />
      ) : entries.length === 0 ? (
        <div className="rounded-card bg-surface px-4 py-6 text-center text-sm text-text-secondary">
          ไม่มีคนลาในวันนี้
        </div>
      ) : (
        <ul className="divide-y divide-primary/10 rounded-card bg-surface px-4">
          {entries.map((entry, index) => (
            <li
              key={`${entry.employeeName}-${index}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="text-sm text-primary-dark">{entry.employeeName}</span>
              <span className="text-sm text-text-secondary">{LEAVE_TYPE_LABEL[entry.type]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
