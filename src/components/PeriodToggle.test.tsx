import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodToggle } from './PeriodToggle'

describe('PeriodToggle', () => {
  it('variant default: แสดง 3 ตัวเลือกเต็มวัน/เช้า/บ่าย และ mark ตัวที่เลือกด้วย aria-checked', () => {
    render(<PeriodToggle value="am" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'เต็มวัน' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('radio', { name: 'เช้า' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'บ่าย' })).toHaveAttribute('aria-checked', 'false')
  })

  it('คลิกเลือก "เต็มวัน" → onChange ได้ "full"', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodToggle value="am" onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'เต็มวัน' }))

    expect(onChange).toHaveBeenCalledWith('full')
  })

  it('คลิกเลือก "บ่าย" → onChange ได้ "pm"', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodToggle value="full" onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'บ่าย' }))

    expect(onChange).toHaveBeenCalledWith('pm')
  })

  it('variant compact: mini segmented track เดียวกับ default (bg-surface) แค่ย่อขนาด — เลือก "เช้า" → onChange ได้ "am"', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodToggle value="full" onChange={onChange} variant="compact" />)

    const group = screen.getByRole('radiogroup')
    expect(group).toHaveClass('bg-surface')

    const amButton = screen.getByRole('radio', { name: 'เช้า' })
    expect(amButton).toHaveClass('text-xs')
    await user.click(amButton)

    expect(onChange).toHaveBeenCalledWith('am')
  })

  it('variant compact: ตัวที่เลือกเป็น pill ขาวลอย (shadow-card) ตัวหนังสือ text-primary-dark เหมือน default ไม่ใช่พื้นเขียว', () => {
    render(<PeriodToggle value="am" onChange={vi.fn()} variant="compact" />)

    const selected = screen.getByRole('radio', { name: 'เช้า' })
    expect(selected).toHaveClass('bg-white')
    expect(selected).toHaveClass('text-primary-dark')
    expect(selected).toHaveClass('shadow-card')
    expect(selected).not.toHaveClass('bg-success')
  })

  it('disabled: ปุ่มกดไม่ได้และไม่เรียก onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodToggle value="am" onChange={onChange} disabled />)

    const fullButton = screen.getByRole('radio', { name: 'เต็มวัน' })
    expect(fullButton).toBeDisabled()

    await user.click(fullButton)
    expect(onChange).not.toHaveBeenCalled()
  })
})
