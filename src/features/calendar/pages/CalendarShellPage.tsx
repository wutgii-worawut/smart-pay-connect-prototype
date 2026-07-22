/**
 * features/calendar/pages/CalendarShellPage.tsx — route `/calendar` (P17, feature-plans/06-calendar.md
 * §6.2-6.3) SegmentedTabs (shape="card") สลับ 2 แท็บบนสุด: ปฏิทินการลา | วันหยุด — ทำเต็มเฉพาะแท็บ
 * "วันหยุด" (hero + list + details) แท็บ "ปฏิทินการลา" เป็น placeholder เรียบ ๆ รอ P18
 *
 * page เป็นเจ้าของ query (`useHolidays`) + state ปีที่เลือก + state holiday ที่เปิด details —
 * component ลูก (`NextHolidayHero`/`HolidayListItem`/`HolidayDetails`) presentational ล้วน (มิเรอร์
 * pattern D2 ของ leave — ห้าม useQuery/navigate ใน component ย่อย)
 *
 * แท็บ "ปฏิทินการลา" (P18) แยก query/state ของตัวเองไปที่ `LeaveCalendarView` (container ภายใน feature —
 * มิเรอร์ `AttendanceHistoryPage`) หน้านี้แค่ render ไม่ถือ state ของแท็บนั้น
 */
import { useState } from 'react'
import { DropdownFilter } from '@/components/DropdownFilter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Spinner } from '@/components/Spinner'
import { useHolidays } from '@/hooks/useHolidays'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import type { Holiday } from '@/types/holiday'
import { HolidayDetails } from '../components/HolidayDetails'
import { HolidayListItem } from '../components/HolidayListItem'
import { LeaveCalendarView } from '../components/LeaveCalendarView'
import { NextHolidayHero } from '../components/NextHolidayHero'
import { daysUntil, generateHolidayYearOptions, getNextHoliday } from '../utils/holidays'

type CalendarTab = 'leave' | 'holidays'

function isCalendarTab(value: string): value is CalendarTab {
  return value === 'leave' || value === 'holidays'
}

export function CalendarShellPage() {
  usePageTitle('ดูวันหยุด')

  const [tab, setTab] = useState<CalendarTab>('leave')

  const [currentYear] = useState(() => new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
  const [yearOptions] = useState(() => generateHolidayYearOptions(currentYear))

  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)

  const holidaysQuery = useHolidays(year)

  const today = new Date()
  const nextHoliday = holidaysQuery.data ? getNextHoliday(holidaysQuery.data, today) : null
  const daysUntilNext = nextHoliday ? daysUntil(nextHoliday.date, today) : 0

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <SegmentedTabs
          shape="card"
          value={tab}
          onChange={(value) => {
            if (isCalendarTab(value)) setTab(value)
          }}
          tabs={[
            { value: 'leave', label: 'ปฏิทินการลา' },
            { value: 'holidays', label: 'วันหยุด' },
          ]}
        />

        <div className="mt-4">
          {tab === 'leave' ? (
            <LeaveCalendarView />
          ) : holidaysQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8 border-primary" />
            </div>
          ) : holidaysQuery.isError ? (
            <ErrorState
              message={
                holidaysQuery.error instanceof ApiError
                  ? holidaysQuery.error.message
                  : 'โหลดรายการวันหยุดไม่สำเร็จ'
              }
              onRetry={() => void holidaysQuery.refetch()}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <NextHolidayHero nextHoliday={nextHoliday} daysUntil={daysUntilNext} />

              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-primary-dark">รายการวันหยุด</h1>
                <DropdownFilter
                  options={yearOptions}
                  value={String(year)}
                  onChange={(value) => setYear(Number(value))}
                  ariaLabel="กรองปี"
                />
              </div>

              {!holidaysQuery.data || holidaysQuery.data.length === 0 ? (
                <EmptyState message="ไม่มีวันหยุดในปีนี้" />
              ) : (
                <div className="space-y-3">
                  {holidaysQuery.data.map((holiday) => (
                    <HolidayListItem
                      key={`${holiday.date}-${holiday.name}`}
                      holiday={holiday}
                      onClick={() => setSelectedHoliday(holiday)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HolidayDetails
        holiday={selectedHoliday}
        open={selectedHoliday !== null}
        onClose={() => setSelectedHoliday(null)}
      />
    </div>
  )
}
