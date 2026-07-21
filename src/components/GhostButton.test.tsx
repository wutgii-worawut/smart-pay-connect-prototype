import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GhostButton } from './GhostButton'

describe('GhostButton', () => {
  it('เรียก onClick เมื่อกด', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<GhostButton onClick={handleClick}>ปิด</GhostButton>)

    await user.click(screen.getByRole('button', { name: 'ปิด' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled ระหว่าง isPending', () => {
    render(<GhostButton isPending>กลับหน้าหลัก</GhostButton>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shape="pill" ให้ class rounded-full', () => {
    render(<GhostButton shape="pill">ปิด</GhostButton>)

    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })

  it('ไม่ส่ง shape (ค่าเริ่มต้น) ให้ class rounded-card', () => {
    render(<GhostButton>ปิด</GhostButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('rounded-card')
    expect(button).not.toHaveClass('rounded-full')
  })
})
