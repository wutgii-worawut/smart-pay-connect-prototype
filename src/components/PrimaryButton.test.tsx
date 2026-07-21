import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrimaryButton } from './PrimaryButton'

describe('PrimaryButton', () => {
  it('เรียก onClick เมื่อกด', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<PrimaryButton onClick={handleClick}>ลงทะเบียน</PrimaryButton>)

    await user.click(screen.getByRole('button', { name: 'ลงทะเบียน' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled ระหว่าง isPending และไม่เรียก onClick เมื่อกด (กันกดรัว §20.4)', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <PrimaryButton onClick={handleClick} isPending>
        ส่งคำขอ
      </PrimaryButton>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('แสดง pendingText แทน children เมื่อ isPending และส่ง pendingText มา', () => {
    render(
      <PrimaryButton isPending pendingText="กำลังส่ง...">
        ส่งคำขอ
      </PrimaryButton>,
    )

    expect(screen.getByText('กำลังส่ง...')).toBeInTheDocument()
    expect(screen.queryByText('ส่งคำขอ')).not.toBeInTheDocument()
  })

  it('disabled เมื่อ prop disabled=true แม้ไม่ได้ isPending', () => {
    render(<PrimaryButton disabled>ลงทะเบียน</PrimaryButton>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shape="pill" ให้ class rounded-full', () => {
    render(<PrimaryButton shape="pill">ลงทะเบียน</PrimaryButton>)

    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })

  it('ไม่ส่ง shape (ค่าเริ่มต้น) ให้ class rounded-card', () => {
    render(<PrimaryButton>ลงทะเบียน</PrimaryButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('rounded-card')
    expect(button).not.toHaveClass('rounded-full')
  })
})
