import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DangerSoftButton } from './DangerSoftButton'

describe('DangerSoftButton', () => {
  it('เรียก onClick เมื่อกด', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<DangerSoftButton onClick={handleClick}>ไม่อนุมัติ</DangerSoftButton>)

    await user.click(screen.getByRole('button', { name: 'ไม่อนุมัติ' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled ระหว่าง isPending และไม่เรียก onClick เมื่อกด', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <DangerSoftButton onClick={handleClick} isPending>
        ยกเลิกคำขอ
      </DangerSoftButton>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shape="pill" ให้ class rounded-full', () => {
    render(<DangerSoftButton shape="pill">ยกเลิกคำขอ</DangerSoftButton>)

    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })

  it('ไม่ส่ง shape (ค่าเริ่มต้น) ให้ class rounded-card', () => {
    render(<DangerSoftButton>ยกเลิกคำขอ</DangerSoftButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('rounded-card')
    expect(button).not.toHaveClass('rounded-full')
  })
})
