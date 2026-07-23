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
  // ไอคอนกระเป๋าทำงาน (Figma 2026-07-23) — สีตาม currentColor (active=ขาว / inactive=success)
  return (
    <svg viewBox="0 0 60 60" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M35 16.25V11.25H25V16.25H35ZM10 21.25V48.75H50V21.25H10ZM50 16.25C52.775 16.25 55 18.475 55 21.25V48.75C55 51.525 52.775 53.75 50 53.75H10C7.225 53.75 5 51.525 5 48.75L5.025 21.25C5.025 18.475 7.225 16.25 10 16.25H20V11.25C20 8.475 22.225 6.25 25 6.25H35C37.775 6.25 40 8.475 40 11.25V16.25H50Z"
      />
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
        'inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium text-white shadow-card transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        // ปุ่มพื้นเขียว #049855 (bg-success) ตัวอักษร+ไอคอนขาว — ทั้ง active(เลือกแล้ว) และ
        // inactive(ตัวเลือกให้แตะ) เป็นปุ่มเขียวเหมือนกันตาม design (feature-plans/02 "pill เขียว")
        'bg-success',
      ].join(' ')}
    >
      <BriefcaseIcon />
      ไปทำงานนอกสถานที่
    </button>
  )
}
