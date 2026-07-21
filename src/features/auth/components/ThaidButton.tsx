/**
 * features/auth/components/ThaidButton.tsx — ปุ่ม/การ์ด "ลงทะเบียนด้วย ThaID"
 * (feature-plans/01 §1.1 "1.LINEOA-Registration.png" / §1.2 "...Digital ID Only.png")
 *
 * ⚠️ Open Question §23 (architecture.md) — ThaID OAuth integration = scope ใหญ่แยกต่างหาก ยังไม่เคาะ
 * phase. ปุ่มนี้แสดงตาม design เท่านั้น กดแล้วแจ้งผู้ใช้ว่ายังไม่เปิดใช้งาน
 * **ห้ามต่อ flow OAuth ThaID จริงในไฟล์นี้**
 *
 * variant='pill' (จอ 1.1 — แถวขาวขอบบางใน S13/`GhostButton`) ใช้ shared button ตรง ๆ
 * variant='card' (จอ 1.2 Digital ID Only — การ์ดรูปสี่เหลี่ยมใหญ่ 1 รูป) ไม่เข้ากับโครง
 * `GhostButton` (แถวเดียวกว้างเต็ม padding คงที่) จึงเขียนปุ่มเองแต่ยังคง token เดียวกัน
 * (rounded-card / shadow-card / focus ring primary)
 *
 * [Figma pass] pill variant ในรูปมีไอคอน ThaID ชิดซ้าย + info icon ชิดขวาสุด (justify-between)
 * — ที่นี่จัดกึ่งกลางเป็นกลุ่มเดียวแทน เพราะ `GhostButton` บังคับ `justify-center` (ไม่กระทบ
 * token/สี แค่ layout) — เก็บไว้เป็นงานค้าง Figma fidelity เหมือนเฟสก่อนหน้า
 */
import thaIdLogo from '@/assets/thai-id/thai-id-logo.png'
import { GhostButton } from '@/components/GhostButton'
import { toastError } from '@/components/toast'

interface ThaidButtonProps {
  variant?: 'pill' | 'card'
}

function handleThaidClick(): void {
  toastError('ลงทะเบียนด้วย ThaID ยังไม่เปิดใช้งาน')
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5 shrink-0 text-text-secondary"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ThaidButton({ variant = 'pill' }: ThaidButtonProps) {
  if (variant === 'card') {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleThaidClick}
          aria-label="ลงทะเบียนด้วยแอปพลิเคชัน ThaID"
          className="h-56 w-56 overflow-hidden rounded-card shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <img src={thaIdLogo} alt="" className="h-full w-full object-cover" aria-hidden="true" />
        </button>
        <span className="flex items-center gap-1 text-sm text-primary-dark">
          แอปพลิเคชัน ThaID
          <InfoIcon />
        </span>
      </div>
    )
  }

  return (
    <GhostButton
      shape="pill"
      onClick={handleThaidClick}
      icon={<img src={thaIdLogo} alt="" className="h-7 w-7 rounded-card" aria-hidden="true" />}
    >
      <span className="inline-flex items-center gap-1">
        แอปพลิเคชัน ThaID
        <InfoIcon />
      </span>
    </GhostButton>
  )
}
