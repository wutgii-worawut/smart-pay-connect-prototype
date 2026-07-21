/**
 * components/Select.tsx — dropdown select primitive (hand-vendor จาก @radix-ui/react-select,
 * §10.1-10.2 — copy source มา restyle ด้วย token เราตรง ๆ ไม่ผ่าน shadcn CLI ตามที่ผู้ใช้เคาะ P4)
 * เป็น base ให้ SelectField (S16) ต่อยอด label+error — ไม่มี business logic ในนี้
 *
 * DropdownFilter (P5, S3 — กรองปี/เดือน/สถานะ) เป็น native <select> คนละตัว ไม่ใช้ primitive นี้
 * (P5 บันทึกแก้แผน: ยังไม่มี design เปิด dropdown ให้เทียบ ตัดสินคงไว้เป็น native ต่อ)
 *
 * RHF: Radix Select ไม่ใช่ native <select> — register() ใช้ตรง ๆ ไม่ได้ ต้องต่อผ่าน <Controller>
 * (ดูตัวอย่างที่ SelectField.tsx)
 */
import { forwardRef } from 'react'
import * as RadixSelect from '@radix-ui/react-select'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  name?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  id?: string
  ariaLabel?: string
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-text-secondary"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, onBlur, name, options, placeholder, disabled, hasError, id, ariaLabel },
  ref,
) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} name={name} disabled={disabled}>
      <RadixSelect.Trigger
        ref={ref}
        id={id}
        onBlur={onBlur}
        aria-label={ariaLabel}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-card border bg-white px-4 py-3.5 text-base text-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-text-secondary',
          hasError ? 'border-danger' : 'border-primary/15',
        ].join(' ')}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-64 overflow-hidden rounded-card border border-primary/10 bg-white shadow-card"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="cursor-pointer rounded-card px-3 py-2.5 text-base text-primary-dark outline-none data-[highlighted]:bg-surface data-[state=checked]:font-semibold data-[state=checked]:text-primary"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
})
