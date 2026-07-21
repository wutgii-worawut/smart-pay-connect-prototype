import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextInput } from './TextInput'

describe('TextInput', () => {
  it('render label + error พร้อม aria-invalid และขอบสีแดง', () => {
    render(<TextInput label="อีเมล" name="email" error="กรุณากรอกอีเมล" />)

    expect(screen.getByText('อีเมล')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveClass('border-danger')
    expect(screen.getByText('กรุณากรอกอีเมล')).toBeInTheDocument()
  })

  it('shape="pill" (จอ Registration) → class rounded-full, ค่าเริ่มต้น rounded-card', () => {
    const { rerender } = render(<TextInput label="เลขบัตร" name="citizenId" shape="pill" />)
    expect(screen.getByRole('textbox')).toHaveClass('rounded-full')

    rerender(<TextInput label="เลขบัตร" name="citizenId" />)
    expect(screen.getByRole('textbox')).toHaveClass('rounded-card')
  })

  it('font ต้อง >=16px (text-base) กัน iOS auto-zoom', () => {
    render(<TextInput label="เลขบัตร" name="citizenId" />)
    expect(screen.getByRole('textbox')).toHaveClass('text-base')
  })

  it('mask="citizenId": พิมพ์ตัวเลขต่อเนื่อง → จัดกลุ่มขีดอัตโนมัติเป็น 1-2345-67890-12-3', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [value, setValue] = useState('')
      return (
        <TextInput
          label="เลขประจำตัวประชาชน"
          name="citizenId"
          mask="citizenId"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      )
    }

    render(<Controlled />)
    const input = screen.getByRole('textbox')

    await user.type(input, '1234567890123')

    expect(input).toHaveValue('1-2345-67890-12-3')
  })

  it('mask="citizenId": ตัดอักขระที่ไม่ใช่ตัวเลขและจำกัดไม่เกิน 13 หลัก', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    function Controlled() {
      const [value, setValue] = useState('')
      return (
        <TextInput
          label="เลขประจำตัวประชาชน"
          name="citizenId"
          mask="citizenId"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            onChange(event.target.value)
          }}
        />
      )
    }

    render(<Controlled />)
    const input = screen.getByRole('textbox')

    await user.type(input, '12345678901239999')

    expect(input).toHaveValue('1-2345-67890-12-3')
  })
})
