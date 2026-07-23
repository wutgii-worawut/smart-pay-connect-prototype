/**
 * features/attendance/components/RangeStatusPill.tsx — pill มุมขวาบนแผนที่บอกผล geofence
 * (feature-plans/02) เขียว "อยู่ในรัศมี" / แดง "อยู่นอกรัศมี" — เป็นผล **preview ฝั่ง client เท่านั้น**
 * (haversine, §15) ไม่ใช่ตัวตัดสินอนุญาตลงเวลาจริง
 */
interface RangeStatusPillProps {
  status: 'in-range' | 'out-of-range'
}

function TargetIcon() {
  // ไอคอนสถานะตำแหน่ง (Figma 2026-07-23) — ใช้ชุดเดียวทั้ง in-range/out-of-range ต่างที่สีพื้น pill
  return (
    <svg viewBox="0 0 50 50" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M44.35 40.825C47.875 36.5 50 31 50 25C50 11.2 38.8 0 25 0C11.2 0 0 11.2 0 25C0 38.8 11.2 50 25 50C31 50 36.5 47.875 40.825 44.35C41.5 43.8 42.15 43.2 42.775 42.575C42.85 42.5 42.9 42.425 42.95 42.375C43.45 41.875 43.925 41.35 44.35 40.825ZM25 45C13.975 45 5 36.025 5 25C5 13.975 13.975 5 25 5C36.025 5 45 13.975 45 25C45 29.625 43.425 33.85 40.775 37.25L37.2 33.675C38.925 31.225 39.95 28.25 39.95 25.025C39.95 16.75 33.225 10.025 24.95 10.025C16.675 10.025 9.95 16.75 9.95 25.025C9.95 33.3 16.675 40.025 24.95 40.025C28.2 40.025 31.225 38.975 33.675 37.2L37.225 40.75C33.85 43.425 29.625 45 25 45ZM29.8 26.275C30.225 24.625 29.85 22.825 28.575 21.525L28.525 21.475C26.6 19.55 23.525 19.525 21.575 21.375C21.55 21.4 21.5 21.425 21.45 21.475C19.5 23.425 19.5 26.6 21.45 28.55L21.5 28.6C22.8 29.875 24.625 30.275 26.275 29.825L30.05 33.6C28.55 34.5 26.825 35.05 24.95 35.05C19.425 35.05 14.95 30.575 14.95 25.05C14.95 19.525 19.425 15.05 24.95 15.05C30.475 15.05 34.95 19.525 34.95 25.05C34.95 26.875 34.425 28.575 33.55 30.05L29.8 26.275Z"
      />
    </svg>
  )
}

export function RangeStatusPill({ status }: RangeStatusPillProps) {
  const isInRange = status === 'in-range'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium text-white shadow-card',
        isInRange ? 'bg-success' : 'bg-danger',
      ].join(' ')}
    >
      <TargetIcon />
      {isInRange ? 'อยู่ในรัศมี' : 'อยู่นอกรัศมี'}
    </span>
  )
}
