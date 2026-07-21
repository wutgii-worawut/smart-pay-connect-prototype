/**
 * features/attendance/components/RangeStatusPill.tsx — pill มุมขวาบนแผนที่บอกผล geofence
 * (feature-plans/02) เขียว "อยู่ในรัศมี" / แดง "อยู่นอกรัศมี" — เป็นผล **preview ฝั่ง client เท่านั้น**
 * (haversine, §15) ไม่ใช่ตัวตัดสินอนุญาตลงเวลาจริง
 */
interface RangeStatusPillProps {
  status: 'in-range' | 'out-of-range'
}

function TargetIcon() {
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
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function RangeStatusPill({ status }: RangeStatusPillProps) {
  const isInRange = status === 'in-range'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white shadow-card',
        isInRange ? 'bg-success' : 'bg-danger',
      ].join(' ')}
    >
      <TargetIcon />
      {isInRange ? 'อยู่ในรัศมี' : 'อยู่นอกรัศมี'}
    </span>
  )
}
