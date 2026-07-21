/**
 * components/SuccessScreen.tsx — จอสำเร็จเต็มหน้า (S17, feature-plans/00 §1)
 * ไอคอนเช็คถูกวงกลมเขียว + หัวข้อ + ข้อความ (+ เนื้อหาเสริม เช่น การ์ดสรุปเวลา/ใบลา) + ปุ่ม action ท้ายจอ
 * ใช้กับ ลงทะเบียนสำเร็จ / ลงเวลาสำเร็จ / ส่งคำขอลาสำเร็จ (feature-plans/00 §1 S17)
 */
import type { ReactNode } from 'react'

interface SuccessScreenProps {
  title: string
  description?: string
  /** เนื้อหาเสริมเฉพาะ feature เช่น การ์ดสรุปเวลาเข้า/ใบลา — เรนเดอร์ใต้หัวข้อ */
  children?: ReactNode
  /** ปุ่ม action ท้ายจอ เช่น <PrimaryButton>กลับหน้าหลัก</PrimaryButton> */
  action: ReactNode
}

export function SuccessScreen({ title, description, children, action }: SuccessScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface px-6 pt-10 pb-safe">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-white"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </span>
        <h1 className="text-xl font-semibold text-primary-dark">{title}</h1>
        {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}

      <div className="mt-auto pt-8">{action}</div>
    </div>
  )
}
