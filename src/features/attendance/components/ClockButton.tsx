/**
 * features/attendance/components/ClockButton.tsx — ปุ่มวงกลมใหญ่ลงเวลา (feature-plans/02)
 * state ตรงกับ `AttendanceUiState` (5 ค่าที่แสดงผลต่างกัน — "completed" คือค่าที่ 5, ค่า "clocked-in"
 * ใช้ทั้งจอ onsite/remote clock-out เพราะ dock ไม่สนใจว่าเป็น type ไหน แค่ให้กดออกงานได้)
 *
 * `isPending` (มาตรฐาน mutation §20.4): disabled เสมอระหว่างส่ง กันกดซ้ำ ไม่ว่า state จะเป็นอะไร
 */
import { Spinner } from '@/components/Spinner'
import type { AttendanceUiState } from '../utils/deriveAttendanceState'

interface ClockButtonProps {
  state: AttendanceUiState
  isPending: boolean
  onClick: () => void
}

function AlarmPlusIcon() {
  // ไอคอนนาฬิกาปลุก + (Figma 2026-07-23) — currentColor = ขาว (ตัวอักษรปุ่มเป็น text-white)
  return (
    <svg viewBox="0 0 100 101" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        fill="currentColor"
        d="M29.4 7.65L23 0L0 19.25L6.45 26.9L29.4 7.65ZM100 19.3L77 0L70.55 7.65L93.55 26.95L100 19.3ZM50 10.7C25.15 10.7 5 30.85 5 55.7C5 80.55 25.1 100.7 50 100.7C74.85 100.7 95 80.55 95 55.7C95 30.85 74.85 10.7 50 10.7ZM50 90.7C30.65 90.7 15 75.05 15 55.7C15 36.35 30.65 20.7 50 20.7C69.35 20.7 85 36.35 85 55.7C85 75.05 69.35 90.7 50 90.7ZM55 35.7H45V50.7H30V60.7H45V75.7H55V60.7H70V50.7H55V35.7Z"
      />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

interface ClockButtonVariant {
  label: string
  disabled: boolean
  bgClass: string
  icon: 'alarm' | 'check'
}

function resolveVariant(state: AttendanceUiState): ClockButtonVariant {
  switch (state) {
    case 'in-range-ready':
      return { label: 'เข้างาน', disabled: false, bgClass: 'bg-primary text-white', icon: 'alarm' }
    case 'remote-ready':
      return { label: 'ลงเวลา', disabled: false, bgClass: 'bg-primary text-white', icon: 'alarm' }
    case 'out-of-range':
      return {
        label: 'ลงเวลา',
        disabled: true,
        bgClass: 'bg-clock-disabled text-white',
        icon: 'alarm',
      }
    case 'clocked-in':
      return { label: 'ออกงาน', disabled: false, bgClass: 'bg-warning text-white', icon: 'alarm' }
    case 'completed':
      return {
        label: 'ลงเวลาออกงานแล้ว',
        disabled: true,
        bgClass: 'bg-primary text-white',
        icon: 'check',
      }
  }
}

export function ClockButton({ state, isPending, onClick }: ClockButtonProps) {
  const variant = resolveVariant(state)
  const disabled = variant.disabled || isPending

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isPending || undefined}
      className={[
        'flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full text-sm font-semibold shadow-card transition-opacity disabled:cursor-not-allowed',
        variant.bgClass,
        disabled ? 'opacity-70' : '',
      ].join(' ')}
    >
      {isPending ? (
        <Spinner className="h-7 w-7 border-white" />
      ) : variant.icon === 'check' ? (
        <CheckCircleIcon />
      ) : (
        <AlarmPlusIcon />
      )}
      <span className="px-2 text-center leading-tight">{variant.label}</span>
    </button>
  )
}
