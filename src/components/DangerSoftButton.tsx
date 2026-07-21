/**
 * components/DangerSoftButton.tsx — ปุ่มรองเชิงลบ (S12, feature-plans/00 §1)
 * พื้นแดงอ่อน (bg-danger/10) + ตัวหนังสือ/ไอคอนแดง — ใช้กับ "ไม่อนุมัติ" / "ยกเลิกคำขอ"
 * isPending: disabled อัตโนมัติ + spinner แทนไอคอนเดิม (§20.4)
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ButtonShape } from './buttonClasses'
import { dangerSoftButtonClass } from './buttonClasses'
import { Spinner } from './Spinner'

interface DangerSoftButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  icon?: ReactNode
  isPending?: boolean
  pendingText?: string
  /** ทรงปุ่มตาม design: 'card' (มุมโค้ง --radius-card, ค่าเริ่มต้น) หรือ 'pill' (มุมโค้งเต็ม) */
  shape?: ButtonShape
}

export function DangerSoftButton({
  children,
  icon,
  isPending = false,
  pendingText,
  disabled = false,
  type = 'button',
  className,
  shape = 'card',
  ...rest
}: DangerSoftButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={[dangerSoftButtonClass(shape), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {isPending ? <Spinner className="h-5 w-5 border-danger" /> : icon}
      <span>{isPending && pendingText ? pendingText : children}</span>
    </button>
  )
}
