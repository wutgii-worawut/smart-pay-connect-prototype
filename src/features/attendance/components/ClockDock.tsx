/**
 * features/attendance/components/ClockDock.tsx — แถบล่างจอลงเวลา (feature-plans/02): ปุ่ม
 * "ประวัติลงเวลา" ซ้าย / ClockButton วงกลมใหญ่กลาง (ล้ำขึ้นไปคาบเกี่ยวแผนที่ตาม design) /
 * "โหลดแผนที่ใหม่" ขวา
 *
 * "โหลดแผนที่ใหม่" = ขอ GPS ใหม่ + panTo บน instance เดิมเท่านั้น (§15 "กติกาการใช้แผนที่") —
 * ห้าม re-init MapView ปุ่มนี้แค่เรียก `onReloadMap` callback ที่ ClockPage เป็นคนสั่ง geo.request()
 */
import type { AttendanceUiState } from '../utils/deriveAttendanceState'
import { ClockButton } from './ClockButton'

interface ClockDockProps {
  state: AttendanceUiState
  isPending: boolean
  onClockAction: () => void
  onHistory: () => void
  onReloadMap: () => void
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

function ReloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </svg>
  )
}

export function ClockDock({
  state,
  isPending,
  onClockAction,
  onHistory,
  onReloadMap,
}: ClockDockProps) {
  return (
    <div className="relative rounded-t-card bg-white pt-10 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-card">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2">
        <ClockButton state={state} isPending={isPending} onClick={onClockAction} />
      </div>

      <div className="flex items-center justify-between px-6">
        <button
          type="button"
          onClick={onHistory}
          className="flex flex-col items-center gap-1 text-sm font-medium text-primary-dark"
        >
          <HistoryIcon />
          ประวัติลงเวลา
        </button>

        <div className="w-32" aria-hidden="true" />

        <button
          type="button"
          onClick={onReloadMap}
          className="flex flex-col items-center gap-1 text-sm font-medium text-primary-dark"
        >
          <ReloadIcon />
          โหลดแผนที่ใหม่
        </button>
      </div>
    </div>
  )
}
