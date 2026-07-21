/**
 * components/FilterChips.tsx — ชิปกลมเลือกกรอง (S2, feature-plans/00 §1) เช่น ทั้งหมด/ลาป่วย/ลาพักร้อน/ลากิจ
 * horizontal scroll แนวนอน — controlled ล้วน, ค่าเก็บเป็น string[] เสมอ (single mode = array ยาว 1)
 * multiple=false (ค่าเริ่มต้น): เลือกได้ทีละอัน (คล้าย radio) / multiple=true: toggle ได้หลายอัน
 */
interface FilterChipOption {
  value: string
  label: string
}

interface FilterChipsProps {
  options: FilterChipOption[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  className?: string
}

export function FilterChips({
  options,
  value,
  onChange,
  multiple = false,
  className,
}: FilterChipsProps) {
  function handleClick(optionValue: string) {
    if (multiple) {
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange(next)
      return
    }
    onChange([optionValue])
  }

  return (
    <div
      className={['flex gap-2 overflow-x-auto pb-1', className].filter(Boolean).join(' ')}
    >
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => handleClick(option.value)}
            className={[
              'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-2 border-primary bg-primary/10 text-primary'
                : 'border border-text-secondary/15 bg-white text-text-secondary',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
