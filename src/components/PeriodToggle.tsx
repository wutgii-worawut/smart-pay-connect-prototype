/**
 * components/PeriodToggle.tsx — เลือกช่วงเวลาของวันลา เต็มวัน/เช้า/บ่าย (S16, feature-plans/00 §1)
 * value ตรงกับ LeaveDayPeriod (src/types/leave.ts) — controlled ล้วน (value+onChange)
 *
 * 2 variant ตาม design (3.Leave/6.1 vs 6.2) — **โครงเดียวกัน** segmented track พื้น `bg-surface`
 * ตัวที่เลือก = pill ขาวลอย (`shadow-card`) ตัวหนังสือ `text-primary-dark` หนา ต่างกันแค่ขนาด:
 * - 'default' (ค่าเริ่มต้น) — ใช้ตอนวันเดียว (6.1): เต็มความกว้าง padding/font ใหญ่
 * - 'compact' — ใช้เป็น mini segmented ต่อแถวรายวันตอนหลายวัน (6.2): แคบลง padding/font เล็กลง,
 *   ไม่ยืดเต็มความกว้าง (แถวมีวันที่ + calendar icon อยู่ข้างหน้าด้วย)
 * (แก้ตาม review: เดิม compact เข้าใจผิดเป็นชิปแยกพื้นเขียว — ดูรูปจริงแล้วไม่มีสีเขียว
 * สีเขียวในจอ 6.2 คือกล่อง "รวมจำนวนวันลา" คนละส่วนกัน)
 */
import type { LeaveDayPeriod } from '@/types/leave'

interface PeriodOption {
  value: LeaveDayPeriod
  label: string
}

const OPTIONS: PeriodOption[] = [
  { value: 'full', label: 'เต็มวัน' },
  { value: 'am', label: 'เช้า' },
  { value: 'pm', label: 'บ่าย' },
]

interface PeriodToggleProps {
  value: LeaveDayPeriod
  onChange: (value: LeaveDayPeriod) => void
  variant?: 'default' | 'compact'
  disabled?: boolean
  className?: string
  /** label สำหรับ screen reader ของกลุ่ม radio เช่น "ช่วงเวลาวันที่ 19 มิ.ย." */
  ariaLabel?: string
}

export function PeriodToggle({
  value,
  onChange,
  variant = 'default',
  disabled = false,
  className,
  ariaLabel,
}: PeriodToggleProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'flex gap-1 rounded-full bg-surface',
        isCompact ? 'p-0.5' : 'p-1',
        isCompact ? undefined : 'w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={[
              'rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              isCompact ? 'px-2.5 py-1 text-xs' : 'flex-1 py-2.5 text-base',
              selected ? 'bg-white font-semibold text-primary-dark shadow-card' : 'text-text-secondary',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
