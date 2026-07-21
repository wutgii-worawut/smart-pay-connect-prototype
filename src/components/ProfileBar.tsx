/**
 * components/ProfileBar.tsx — แถบโปรไฟล์ใต้ LIFF header (S15, feature-plans/00 §1)
 * design (5.Payroll/1.Payslip History.png): ชื่อตัวหนา + อีเมลเทาใต้ + kebab ⋮ ขวา (ไม่มี avatar
 * ในรูปจริง — เผื่อ prop avatar ไว้ให้ยืดหยุ่นแต่ไม่บังคับใช้)
 */
import type { ReactNode } from 'react'

interface ProfileBarProps {
  name: string
  /** บรรทัดรองใต้ชื่อ เช่น อีเมล */
  subtitle?: string
  avatar?: ReactNode
  /** ปุ่ม/เมนูท้ายแถว เช่น kebab ⋮ — logic เปิดเมนูเป็นหน้าที่ page ที่ประกอบ */
  trailing?: ReactNode
  className?: string
}

export function ProfileBar({ name, subtitle, avatar, trailing, className }: ProfileBarProps) {
  return (
    <div
      className={['flex items-center gap-3 bg-white px-4 py-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-primary-dark">{name}</p>
        {subtitle ? <p className="truncate text-sm text-text-secondary">{subtitle}</p> : null}
      </div>
      {trailing}
    </div>
  )
}
