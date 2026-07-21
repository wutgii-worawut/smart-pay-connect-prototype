/**
 * components/BottomActionBar.tsx — แถบปุ่มติดขอบล่างจอ (S14, feature-plans/00 §1)
 * รองรับ 1-2 ปุ่ม (primary เสมอ, secondary ไม่บังคับ — เช่น ไม่อนุมัติ/อนุมัติ) เรียงซ้าย(secondary)→ขวา(primary)
 * กัน safe-area ตาม architecture §10.2 / code-style.md (pb คำนวณจาก safe-area-inset-bottom เสมอ)
 */
import type { ReactNode } from 'react'

interface BottomActionBarProps {
  primary: ReactNode
  secondary?: ReactNode
}

export function BottomActionBar({ primary, secondary }: BottomActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-text-secondary/15 bg-white px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-card">
      {secondary ? <div className="flex-1">{secondary}</div> : null}
      <div className="flex-1">{primary}</div>
    </div>
  )
}
