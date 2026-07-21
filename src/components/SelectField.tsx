/**
 * components/SelectField.tsx — SelectField (S16, feature-plans/00 §1) = Select primitive + label/error
 * ใช้ในฟอร์มลา (3.Leave/6.1-6.2: ผู้ปฏิบัติงานแทน / ผู้อนุมัติ) — ทรง rounded-card เสมอ
 *
 * RHF: ต่อผ่าน <Controller> (Radix Select ไม่ใช่ native <select>):
 *   <Controller
 *     name="substituteId"
 *     control={control}
 *     render={({ field, fieldState }) => (
 *       <SelectField
 *         label="ผู้ปฏิบัติงานแทน"
 *         options={teammates}
 *         value={field.value}
 *         onValueChange={field.onChange}
 *         onBlur={field.onBlur}
 *         name={field.name}
 *         ref={field.ref}
 *         error={fieldState.error?.message}
 *       />
 *     )}
 *   />
 */
import { forwardRef } from 'react'
import type { SelectOption } from './Select'
import { Select } from './Select'

interface SelectFieldProps {
  label?: string
  error?: string
  value?: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  name?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  containerClassName?: string
}

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(function SelectField(
  { label, error, id, name, containerClassName, ...rest },
  ref,
) {
  const fieldId = id ?? name

  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-primary-dark">
          {label}
        </label>
      ) : null}
      <Select ref={ref} id={fieldId} name={name} hasError={Boolean(error)} {...rest} />
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  )
})
