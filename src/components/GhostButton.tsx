/**
 * components/GhostButton.tsx — ปุ่มรอง/ทางเลือก (S13, feature-plans/00 §1)
 * ขาวขอบบาง — ใช้กับ "ปิด" / ลงทะเบียนด้วย ThaID / นำทางกลับ (เช่น "กลับหน้า SmartPay Connect")
 * isPending: disabled อัตโนมัติ + spinner แทนไอคอนเดิม (§20.4)
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ButtonShape } from './buttonClasses'
import { ghostButtonClass } from './buttonClasses'
import { Spinner } from './Spinner'

interface GhostButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  icon?: ReactNode
  isPending?: boolean
  pendingText?: string
  /** ทรงปุ่มตาม design: 'card' (มุมโค้ง --radius-card, ค่าเริ่มต้น) หรือ 'pill' (มุมโค้งเต็ม) */
  shape?: ButtonShape
}

export function GhostButton({
  children,
  icon,
  isPending = false,
  pendingText,
  disabled = false,
  type = 'button',
  className,
  shape = 'card',
  ...rest
}: GhostButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={[ghostButtonClass(shape), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {isPending ? <Spinner className="h-5 w-5 border-primary-dark" /> : icon}
      <span>{isPending && pendingText ? pendingText : children}</span>
    </button>
  )
}
