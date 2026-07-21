/**
 * components/ListCard.tsx — การ์ดขาวมุมมนในทุก list (S6, feature-plans/00 §1)
 * ใช้ในทุก list ของ leave/payroll/attendance/approval: icon+หัวเรื่อง+badge+บรรทัดรอง+"ตรวจสอบ ›"
 * รับ slot ผ่าน props ล้วน — ไม่มี business logic (data-fetching/navigate อยู่ที่ page ที่ประกอบ)
 */
import type { ReactNode } from 'react'

interface ListCardProps {
  /** ไอคอนนำหน้า เช่น LeaveTypeIcon */
  leading?: ReactNode
  title: ReactNode
  /** บรรทัดรองใต้หัวเรื่อง เช่น "8 มิ.ย. 2569 · 1 วัน · เต็มวัน" */
  meta?: ReactNode
  /** เนื้อหาท้ายแถวหัวเรื่อง เช่น StatusBadge */
  trailing?: ReactNode
  /** ถ้ามี = การ์ดกดได้ + แสดงลูกศร ›  */
  onClick?: () => void
  className?: string
}

export function ListCard({ leading, title, meta, trailing, onClick, className }: ListCardProps) {
  const content = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-semibold text-primary-dark">{title}</div>
          {trailing}
        </div>
        {meta ? <div className="mt-1 truncate text-sm text-text-secondary">{meta}</div> : null}
      </div>
      {onClick ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0 text-text-secondary"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      ) : null}
    </>
  )

  const cardClassName = [
    'flex w-full items-center gap-3 rounded-card bg-white p-4 text-left shadow-card',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {content}
      </button>
    )
  }

  return <div className={cardClassName}>{content}</div>
}
