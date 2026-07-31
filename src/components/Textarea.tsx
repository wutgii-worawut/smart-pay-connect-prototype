/**
 * components/Textarea.tsx — ช่องกรอกข้อความหลายบรรทัด (S16, feature-plans/00 §1)
 * native <textarea> + forwardRef → ใช้กับ RHF `register()` ได้ตรง ๆ เหมือน TextInput
 * ใช้กับเหตุผลการลา (3.Leave/6.1-6.2) และความเห็นผู้อนุมัติ (4.Leave Approval/2.Pending Details.png)
 *
 * ทรงเดียว rounded-rect (--radius-card) เสมอ — ไม่มี pill variant (design ไม่มีจอไหนใช้ textarea ทรง pill,
 * ต่างจาก TextInput ที่มี duality กับจอ Registration)
 * font บังคับ >=16px (text-base) กัน iOS WebKit auto-zoom เหมือน TextInput
 */
import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, name, className, containerClassName, rows = 4, ...rest },
  ref,
) {
  const fieldId = id ?? name
  const errorId = error && fieldId ? `${fieldId}-error` : undefined

  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-primary-dark">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId}
        className={[
          'w-full resize-none rounded-card border bg-white px-4 py-3.5 text-base text-primary-dark placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-danger' : 'border-primary/15',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
})
