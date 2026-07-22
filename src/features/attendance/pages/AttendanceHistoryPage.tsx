/**
 * features/attendance/pages/AttendanceHistoryPage.tsx — route `/attendance/history` (จอ `10.History.png`)
 * โครง: แถบกรอง "ประจำเดือน" (`DropdownFilter`, S3) → รายการไทม์ไลน์ต่อวัน (`AttendanceHistoryList`)
 *
 * ⚠️ ไม่มี `ProfileBar` ในไฟล์นี้ — เหตุผลเดียวกับ `ClockPage`: ต้องใช้ชื่อพนักงานจาก `features/auth`
 * แต่กฎเหล็ก §6 ห้าม cross-feature import — compose ที่ `app/AttendanceHistoryRoute.tsx` แทน
 *
 * ค่าเริ่มต้นของ filter เดือน: seed จาก `new Date()` (client clock) — ยอมรับได้เพราะเป็นแค่ค่าเริ่มต้น
 * ของ UI filter (ผู้ใช้เปลี่ยนเองได้ทันที) ไม่ใช่การตัดสินใจ business ใด ๆ (ต่างจาก §15 ที่ห้าม client
 * clock ตัดสิน geofence/quota) — เดือนจริงที่แสดงผลมาจาก `date` string ที่ server ส่งกลับต่อวันเสมอ
 */
import { useState } from 'react'
import { format } from 'date-fns'
import { DropdownFilter } from '@/components/DropdownFilter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { ApiError } from '@/lib/api-client'
import { AttendanceHistoryList } from '../components/AttendanceHistoryList'
import { useAttendanceHistory } from '../hooks/useAttendanceHistory'
import { generateMonthOptions } from '../utils/monthOptions'

export function AttendanceHistoryPage() {
  // คำนวณครั้งเดียวตอน mount (lazy initializer) กัน re-render ทำให้ list ตัวเลือกขยับ และให้
  // `vi.setSystemTime` ในเทสต์มีผลตอน render จริง ไม่ใช่ตอน import module
  const [monthOptions] = useState(() => generateMonthOptions(new Date()))
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const { data: days, isLoading, isError, error, refetch } = useAttendanceHistory(month)

  return (
    <div className="flex h-full flex-col">
      <div className="border-t border-dashed border-primary/15" />

      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm font-medium text-text-secondary">ประจำเดือน</span>
        <DropdownFilter
          options={monthOptions}
          value={month}
          onChange={setMonth}
          ariaLabel="กรองประจำเดือน"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 border-primary" />
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof ApiError ? error.message : 'โหลดประวัติลงเวลาไม่สำเร็จ'}
            onRetry={() => void refetch()}
          />
        ) : !days || days.length === 0 ? (
          <EmptyState message="เดือนนี้ยังไม่มีประวัติลงเวลา" />
        ) : (
          <AttendanceHistoryList days={days} />
        )}
      </div>
    </div>
  )
}
