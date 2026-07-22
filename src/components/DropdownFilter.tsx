/**
 * components/DropdownFilter.tsx — ปุ่ม dropdown ปี/เดือน/สถานะ (S3, feature-plans/00 §1)
 * P5: native <select> restyle เป็น pill ก่อน (จะสลับเป็น shadcn select hand-vendor ตอน P6 —
 * ดู plan.md P5 หมายเหตุ "อย่าเพิ่งพึ่ง shadcn ที่ยังไม่มี") — controlled ล้วน (value+onChange)
 * font ต้อง >=16px (text-base) กัน iOS WebKit auto-zoom เมื่อ focus control ใน LINE in-app browser
 */
interface DropdownFilterOption {
  value: string
  label: string
}

interface DropdownFilterProps {
  options: DropdownFilterOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** label สำหรับ screen reader เช่น "กรองปี" (ไม่แสดงในจอ — ปุ่มจอนี้ไม่มี label ข้างนอกตาม design) */
  ariaLabel: string
  /** ล็อกไม่ให้เปลี่ยนค่า (P14: dropdown สถานะฝั่งรายการรออนุมัติ ล็อกไว้ที่ "รออนุมัติ") */
  disabled?: boolean
  className?: string
}

export function DropdownFilter({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled = false,
  className,
}: DropdownFilterProps) {
  return (
    <div className={['relative inline-flex', className].filter(Boolean).join(' ')}>
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-full border border-primary/15 bg-white py-2.5 pr-9 pl-4 text-base font-medium text-primary-dark focus:outline-none disabled:opacity-60"
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-secondary"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}
