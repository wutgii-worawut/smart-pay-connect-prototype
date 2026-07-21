/**
 * components/TextInput.tsx — ช่องกรอกข้อความบรรทัดเดียว (S16, feature-plans/00 §1)
 * native <input> ธรรมดา + forwardRef → ใช้กับ RHF `register()` ได้ตรง ๆ:
 *   <TextInput label="อีเมล" {...register('email')} error={errors.email?.message} />
 *
 * font บังคับ >=16px (text-base) กัน iOS WebKit auto-zoom เมื่อ focus ใน LINE in-app browser
 * (P5 บันทึกแก้แผน กับดักมือถือ)
 *
 * duality ทรง (P4 บันทึกแก้แผน): design มี 2 ทรงช่องกรอก — 'pill' (จอ Registration มุมโค้งเต็ม)
 * กับ 'card' (มุมโค้ง --radius-card ค่าเริ่มต้น — ใช้ทั่วไป) ควบคุมผ่าน prop `shape`
 *
 * mask="citizenId": จัดกลุ่มตัวเลขที่พิมพ์เป็น "1-2345-67890-12-3" แบบ real-time ผ่าน
 * utils/citizenId.ts (pure function, ไม่มี business validation ในนี้ — checksum เป็นหน้าที่ Zod ของฟอร์ม)
 *
 * ⚠️ สัญญากับ P9 (RegisterForm): ค่าที่เข้าฟอร์ม (RHF form value) เป็น **string ที่ format แล้ว
 * มีขีดคั่น** (เช่น "1-2345-67890-12-3") เพราะ mask เขียนทับ `event.target.value` ก่อนส่งต่อ
 * onChange — ฝั่ง Zod schema ของฟอร์มต้องเรียก `extractCitizenIdDigits(value)` (utils/citizenId.ts)
 * ก่อน validate ความยาว/checksum 13 หลัก และตอนยิง API ก็ต้องส่ง digits ล้วน (ไม่มีขีด) ไม่ใช่ค่า
 * formatted ตรง ๆ
 */
import { forwardRef } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { formatCitizenId } from '@/utils/citizenId'

export type TextInputShape = 'card' | 'pill'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  shape?: TextInputShape
  /** โหมด mask พิเศษ — ตอนนี้รองรับเลขบัตรประชาชน 13 หลักเท่านั้น */
  mask?: 'citizenId'
  containerClassName?: string
}

function shapeClass(shape: TextInputShape): string {
  return shape === 'pill' ? 'rounded-full' : 'rounded-card'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    error,
    shape = 'card',
    mask,
    id,
    name,
    className,
    containerClassName,
    onChange,
    inputMode,
    maxLength,
    ...rest
  },
  ref,
) {
  const fieldId = id ?? name

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (mask === 'citizenId') {
      event.target.value = formatCitizenId(event.target.value)
    }
    onChange?.(event)
  }

  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-primary-dark">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        name={name}
        onChange={handleChange}
        inputMode={mask === 'citizenId' ? 'numeric' : inputMode}
        maxLength={mask === 'citizenId' ? 17 : maxLength}
        aria-invalid={Boolean(error) || undefined}
        className={[
          'w-full border bg-white px-4 py-3.5 text-base text-primary-dark placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
          shapeClass(shape),
          error ? 'border-danger' : 'border-primary/15',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  )
})
