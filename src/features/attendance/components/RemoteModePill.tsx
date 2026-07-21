/**
 * features/attendance/components/RemoteModePill.tsx — pill "ไปทำงานนอกสถานที่" (จอ 6/8 — active)
 *
 * ⚠️ deviation จาก PNG จอ 0 (feature-plans/02 บันทึกไว้ตรง ๆ ในตาราง state: out-of-range ต้อง
 * "โชว์ pill เขียวเป็นทางเลือก" — screenshot จอ 0 ไม่ได้ capture pill นี้ไว้ (เห็นแค่ pill แดง)
 * แต่ตามตาราง state machine ต้องมีทางเข้าสู่ state remote-ready (จอ 6) จาก out-of-range (จอ 0)
 * ได้ ผ่านการแตะ pill นี้ — ทำตาม feature-plan (ตัดสินใจนอก spec ที่ต้องรายงาน)
 *
 * `active=false` (ยังไม่ได้เลือกโหมด, out-of-range) = ปุ่มให้แตะเพื่อเข้าโหมด (outline อ่อน)
 * `active=true` (เลือกแล้ว, remote-ready) = พื้นเขียวทึบตรงตาม design จอ 6/8
 */
interface RemoteModePillProps {
  active: boolean
  onClick?: () => void
  disabled?: boolean
}

function BriefcaseIcon() {
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
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function RemoteModePill({ active, onClick, disabled }: RemoteModePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-card transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        active ? 'bg-success text-white' : 'border border-success/40 bg-white text-success',
      ].join(' ')}
    >
      <BriefcaseIcon />
      ไปทำงานนอกสถานที่
    </button>
  )
}
