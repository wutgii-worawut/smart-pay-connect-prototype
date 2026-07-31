/**
 * components/DateRangeField.tsx — DateRangeField (S16, feature-plans/00 §1)
 * ช่อง "วันที่เริ่ม" + "ถึงวันที่" (design 3.Leave/6.1, 6.2) กดช่องไหนก็ได้ → เปิด Drawer (S16 base = Drawer
 * จาก P6, §10.2) แสดง `Calendar` (P7) โหมด range ให้เลือกช่วง แล้วกด "ยืนยัน" เพื่อ commit ค่า
 *
 * ค่าที่รับ-ส่งเป็น `DateRangeValue = { start: string; end: string }` (string 'YYYY-MM-DD' ตลอดสาย
 * ตามกติกา §4.2) — แปลง Date↔string ผ่าน utils/dateRange.ts เท่านั้น (pure function, ห้าม `new Date(str)`)
 * เลือกวันเดียว (react-day-picker ให้แค่ `from` ไม่มี `to`) ถือเป็น single-day: start===end (ตรง design
 * 6.1 ที่ค่าเริ่มต้น "วันที่เริ่ม"/"ถึงวันที่" เป็นวันเดียวกัน)
 *
 * ปุ่ม +/− ใต้ช่อง "ถึงวันที่" (design 6.1) ขยับ end ทีละ 1 วันแบบเร็ว ไม่ต้องเปิด Drawer
 * (ตัดสินใจนอก spec P7: อยู่ในกลุ่มฟิลด์เดียวกันในรูป จึงผูกไว้ใน DateRangeField ไม่ใช่ปล่อยให้ LeaveForm
 * ทำเอง — เป็น date arithmetic ล้วน ไม่มี business logic วันลา/โควตา)
 *
 * RHF: ไม่ใช่ native input — ต่อผ่าน <Controller> เหมือน SelectField/OTPInput:
 *   <Controller
 *     name="dateRange"
 *     control={control}
 *     render={({ field, fieldState }) => (
 *       <DateRangeField
 *         value={field.value}
 *         onChange={field.onChange}
 *         onBlur={field.onBlur}
 *         name={field.name}
 *         error={fieldState.error?.message}
 *       />
 *     )}
 *   />
 */
import { useState } from 'react'
import { Calendar } from './Calendar'
import { Drawer } from './Drawer'
import { PrimaryButton } from './PrimaryButton'
import type { DateRangeValue } from '@/utils/dateRange'
import { dateRangeToValue, shiftRangeEnd, valueToDateRange } from '@/utils/dateRange'
import { formatThaiDate } from '@/utils/date'

interface DateRangeFieldProps {
  value: DateRangeValue | null
  onChange: (value: DateRangeValue | null) => void
  onBlur?: () => void
  name?: string
  error?: string
  disabled?: boolean
  containerClassName?: string
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-primary"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function stepperClass(enabled: boolean): string {
  const base = 'flex-1 rounded-full py-2 text-lg font-semibold transition-colors'
  return enabled
    ? `${base} bg-success/10 text-success`
    : `${base} cursor-not-allowed bg-surface text-text-secondary/50`
}

export function DateRangeField({
  value,
  onChange,
  onBlur,
  name,
  error,
  disabled = false,
  containerClassName,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false)
  const [draftRange, setDraftRange] = useState(() => valueToDateRange(value))

  const errorId = name ? `${name}-error` : undefined

  function openPicker() {
    if (disabled) return
    setDraftRange(valueToDateRange(value))
    setOpen(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) onBlur?.()
  }

  function handleConfirm() {
    onChange(dateRangeToValue(draftRange))
    setOpen(false)
    onBlur?.()
  }

  function handleShift(deltaDays: number) {
    if (!value) return
    onChange(shiftRangeEnd(value, deltaDays))
  }

  const canDecrement = value !== null && value.start !== value.end

  return (
    <div className={containerClassName}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={name ? `${name}-start` : undefined} className="mb-1.5 block text-sm font-medium text-primary-dark">
            วันที่เริ่ม
          </label>
          <button
            type="button"
            id={name ? `${name}-start` : undefined}
            disabled={disabled}
            onClick={openPicker}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            className={[
              'flex w-full items-center gap-2 rounded-card border bg-white px-4 py-3.5 text-left text-base text-primary-dark disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-danger' : 'border-primary/15',
            ].join(' ')}
          >
            <CalendarIcon />
            <span className={value ? undefined : 'text-text-secondary'}>
              {value ? formatThaiDate(value.start) : 'เลือกวันที่'}
            </span>
          </button>
        </div>

        <div>
          <label htmlFor={name ? `${name}-end` : undefined} className="mb-1.5 block text-sm font-medium text-primary-dark">
            ถึงวันที่
          </label>
          <button
            type="button"
            id={name ? `${name}-end` : undefined}
            disabled={disabled}
            onClick={openPicker}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            className={[
              'flex w-full items-center gap-2 rounded-card border bg-white px-4 py-3.5 text-left text-base text-primary-dark disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-danger' : 'border-primary/15',
            ].join(' ')}
          >
            <CalendarIcon />
            <span className={value ? undefined : 'text-text-secondary'}>
              {value ? formatThaiDate(value.end) : 'เลือกวันที่'}
            </span>
          </button>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              aria-label="ลดวันที่สิ้นสุดลง 1 วัน"
              disabled={disabled || !canDecrement}
              onClick={() => handleShift(-1)}
              className={stepperClass(!disabled && canDecrement)}
            >
              −
            </button>
            <button
              type="button"
              aria-label="เพิ่มวันที่สิ้นสุดอีก 1 วัน"
              disabled={disabled || !value}
              onClick={() => handleShift(1)}
              className={stepperClass(!disabled && Boolean(value))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Drawer open={open} onOpenChange={handleOpenChange} title="เลือกช่วงวันที่">
        <Calendar
          mode="range"
          defaultMonth={draftRange?.from}
          selected={draftRange}
          onSelect={setDraftRange}
        />
        <PrimaryButton
          type="button"
          disabled={!draftRange?.from}
          onClick={handleConfirm}
          className="mt-4"
        >
          ยืนยัน
        </PrimaryButton>
      </Drawer>
    </div>
  )
}
