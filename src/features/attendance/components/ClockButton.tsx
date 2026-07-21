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
      <circle cx="12" cy="13" r="7" />
      <path d="M12 10v3l2 2M5 3 2 6M19 3l3 3M9 13h6" />
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
        bgClass: 'bg-primary/25 text-white/80',
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
