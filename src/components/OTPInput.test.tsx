import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OTPInput } from './OTPInput'

/** wrapper ควบคุม state เอง เพราะ OTPInput เป็น controlled component ล้วน (§testing.md) */
function ControlledOTPInput({ onChangeSpy }: { onChangeSpy?: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <OTPInput
      value={value}
      onChange={(next) => {
        setValue(next)
        onChangeSpy?.(next)
      }}
    />
  )
}

function getCell(index: number) {
  return screen.getByLabelText(`ตัวที่ ${index + 1} จาก 6`)
}

describe('OTPInput', () => {
  it('พิมพ์ทีละตัว → auto-advance โฟกัสไปช่องถัดไป และค่ารวมถูกส่งผ่าน onChange', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(<ControlledOTPInput onChangeSpy={onChangeSpy} />)

    await user.type(getCell(0), 'a')
    expect(getCell(1)).toHaveFocus()
    expect(onChangeSpy).toHaveBeenLastCalledWith('A')

    await user.type(getCell(1), '1')
    expect(getCell(2)).toHaveFocus()
    expect(onChangeSpy).toHaveBeenLastCalledWith('A1')
  })

  it('backspace ในช่องว่าง → ย้อนกลับไปช่องก่อนหน้าและลบค่าช่องนั้น', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(<ControlledOTPInput onChangeSpy={onChangeSpy} />)

    await user.type(getCell(0), 'a')
    // อยู่ที่ช่อง 1 (ว่าง) แล้ว — backspace ต้องย้อนไปช่อง 0 และลบ 'A'
    await user.keyboard('{Backspace}')

    expect(getCell(0)).toHaveFocus()
    expect(onChangeSpy).toHaveBeenLastCalledWith('')
  })

  it('paste รหัส 6 ตัว → เติมครบทุกช่องในครั้งเดียว', () => {
    const onChangeSpy = vi.fn()
    render(<ControlledOTPInput onChangeSpy={onChangeSpy} />)

    const clipboardData = {
      getData: () => 'a1b2c3',
    } as unknown as DataTransfer

    fireEvent.paste(getCell(0), { clipboardData })

    expect(onChangeSpy).toHaveBeenCalledWith('A1B2C3')
  })

  it('ลบตัวกลาง (คลิกช่องกลางแล้วกด backspace) → clear เฉพาะช่องนั้น ไม่ shift ช่องอื่น', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(<ControlledOTPInput onChangeSpy={onChangeSpy} />)

    const clipboardData = {
      getData: () => 'ABC',
    } as unknown as DataTransfer
    fireEvent.paste(getCell(0), { clipboardData })

    expect(getCell(0)).toHaveValue('A')
    expect(getCell(1)).toHaveValue('B')
    expect(getCell(2)).toHaveValue('C')

    await user.click(getCell(1))
    await user.keyboard('{Backspace}')

    // ช่อง 0 และ 2 ต้องคงเดิม — ไม่เลื่อนตำแหน่งมาแทนช่องที่ถูกลบ
    expect(getCell(0)).toHaveValue('A')
    expect(getCell(1)).toHaveValue('')
    expect(getCell(2)).toHaveValue('C')
    expect(onChangeSpy).toHaveBeenLastCalledWith('A C')
  })

  it('แสดง error ใต้ช่องกรอกเมื่อส่ง prop error มา', () => {
    render(<OTPInput value="" onChange={vi.fn()} error="รหัสไม่ถูกต้อง" />)
    expect(screen.getByText('รหัสไม่ถูกต้อง')).toBeInTheDocument()
  })
})
