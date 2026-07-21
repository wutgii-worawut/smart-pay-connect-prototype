/**
 * components/PrimaryButton.tsx — ปุ่มหลัก (S11, feature-plans/00 §1)
 * พื้น --color-primary เต็มความกว้าง ใช้กับ action หลักของจอ (ลงทะเบียน/อนุมัติ/ส่งคำขอ)
 * isPending: disabled อัตโนมัติ + spinner แทนไอคอนเดิม (มาตรฐาน mutation §20.4 — ปุ่ม disabled ระหว่าง isPending กันกดรัว)
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ButtonShape } from './buttonClasses'
import { primaryButtonClass } from './buttonClasses'
import { Spinner } from './Spinner'

interface PrimaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  /** ไอคอนนำหน้าข้อความ (เช่น เครื่องหมายถูก) — ถูกแทนที่ด้วย spinner อัตโนมัติเมื่อ isPending */
  icon?: ReactNode
  isPending?: boolean
  /** ข้อความแทน children ระหว่าง isPending เช่น "กำลังส่ง..." (ไม่บังคับ) */
  pendingText?: string
  /** ทรงปุ่มตาม design: 'card' (มุมโค้ง --radius-card, ค่าเริ่มต้น) หรือ 'pill' (มุมโค้งเต็ม) */
  shape?: ButtonShape
}

export function PrimaryButton({
  children,
  icon,
  isPending = false,
  pendingText,
  disabled = false,
  type = 'button',
  className,
  shape = 'card',
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={[primaryButtonClass(shape), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {isPending ? <Spinner className="h-5 w-5 border-white" /> : icon}
      <span>{isPending && pendingText ? pendingText : children}</span>
    </button>
  )
}
