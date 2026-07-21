/**
 * components/OTPInput.tsx — ช่องกรอกรหัส OTP 6 ตัว อักษร+เลข (S16, feature-plans/01 §1.3)
 * จอ `2.LINEOA-Registration-OTP.png` แสดงรหัสเป็นกล่องเดียว (เช่น "A1B2C3") แต่ feature-plan
 * "01-registration.md" + "00-shared-components.md" S16 ระบุ component ชื่อ OTPInput แบบ 6 ช่อง
 * พร้อม auto-advance/backspace/paste — พฤติกรรมนี้ทำได้จริงเฉพาะแบบ 6 ช่องแยก (input เดียวไม่มี
 * auto-advance ให้ทำ) จึง implement เป็น 6 ช่องแยกตามสเปค component ไม่ใช่ตามภาพ mockup ตรง ๆ
 * (ตัดสินใจนอก spec — รายงานกลับ, ผู้ใช้เคาะแล้วให้คง 6 ช่องแยกตามนี้)
 *
 * controlled ล้วน (value+onChange เป็น string รวม ไม่ export state ภายใน) — RHF ต่อผ่าน <Controller>
 * เหมือน SelectField เพราะไม่ใช่ native input เดี่ยว:
 *   <Controller name="otp" control={control} render={({ field, fieldState }) => (
 *     <OTPInput value={field.value} onChange={field.onChange} onBlur={field.onBlur}
 *       name={field.name} ref={field.ref} error={fieldState.error?.message} />
 *   )} />
 * `ref` ของ component นี้**ไม่ใช่** raw `HTMLInputElement` (มี 6 input ประกอบกัน เลือกอันเดียวไม่ได้
 * ตรง ๆ แบบ type-safe) — expose เป็น handle `{ focus: () => void }` แทน (โฟกัสช่องแรก) ให้
 * RHF `setFocus('otp')` เรียกใช้ได้ตามปกติ โดยไม่ต้องใช้ `as` cast ปิด type error (code-style.md)
 *
 * font ตัวเลข >=16px (text-lg) กัน iOS auto-zoom เหมือน form control อื่น ๆ
 */
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'

export interface OTPInputHandle {
  focus: () => void
}

interface OTPInputProps {
  /** ค่ารวมเป็น string เดียว ความยาว <= length */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  length?: number
  error?: string
  disabled?: boolean
}

function sanitizeChar(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase()
}

/** ' ' (เว้นวรรค) = placeholder ภายในสำหรับ "ช่องกลางที่ถูกลบแล้ว" กันตำแหน่งช่องอื่นเลื่อน —
 * ถือเป็นค่าว่างเสมอเวลาเช็ค/แสดงผล ไม่ใช่ตัวอักษรจริงของรหัส OTP */
function isEmptyChar(char: string | undefined): boolean {
  return !char || char === ' '
}

export const OTPInput = forwardRef<OTPInputHandle, OTPInputProps>(function OTPInput(
  { value, onChange, onBlur, name, length = 6, error, disabled = false },
  ref,
) {
  const cellRefs = useRef<Array<HTMLInputElement | null>>([])

  useImperativeHandle(
    ref,
    () => ({
      focus: () => cellRefs.current[0]?.focus(),
    }),
    [],
  )

  /** ตั้งค่าตัวอักษรที่ตำแหน่ง index โดยไม่ทำให้ตำแหน่งช่องอื่นเลื่อน — ช่องที่ว่าง (รวมช่องกลาง
   * ที่เพิ่งถูกลบ) แทนด้วย ' ' ภายใน แล้วตัดเฉพาะช่องว่างท้ายสุด (ขวาสุด) ออกตอนส่ง onChange จริง */
  function setCharAt(index: number, char: string) {
    const chars = value.padEnd(length, ' ').split('')
    chars[index] = char || ' '
    const joined = chars.join('').slice(0, length)
    onChange(joined.replace(/ +$/, ''))
  }

  function handleCellChange(index: number, rawValue: string) {
    const char = sanitizeChar(rawValue)
    setCharAt(index, char)
    if (char && index < length - 1) {
      cellRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && isEmptyChar(value[index]) && index > 0) {
      event.preventDefault()
      setCharAt(index - 1, '')
      cellRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      cellRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      cellRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, length)
    if (!pasted) return
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    cellRefs.current[focusIndex]?.focus()
  }

  return (
    <div>
      <div className="flex justify-between gap-2">
        {Array.from({ length }).map((_, index) => {
          const char = value[index]
          return (
            <input
              key={index}
              ref={(el) => {
                cellRefs.current[index] = el
              }}
              type="text"
              inputMode="text"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={isEmptyChar(char) ? '' : char}
              disabled={disabled}
              name={index === 0 ? name : undefined}
              aria-label={`ตัวที่ ${index + 1} จาก ${length}`}
              aria-invalid={Boolean(error) || undefined}
              onChange={(event) => handleCellChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              onBlur={index === length - 1 ? onBlur : undefined}
              className={[
                'h-14 w-11 flex-1 rounded-card border bg-white text-center text-lg font-semibold tracking-wide text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-danger' : 'border-primary/15',
              ].join(' ')}
            />
          )
        })}
      </div>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  )
})
