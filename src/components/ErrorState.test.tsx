import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('แสดงข้อความ error ที่ส่งมา', () => {
    render(<ErrorState message="เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต" />)

    expect(screen.getByText('เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต')).toBeInTheDocument()
  })

  it('ไม่แสดงปุ่มลองใหม่เมื่อไม่ส่ง onRetry มา', () => {
    render(<ErrorState message="เกิดข้อผิดพลาด" />)

    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).not.toBeInTheDocument()
  })

  it('เรียก onRetry เมื่อกดปุ่มลองใหม่', async () => {
    const handleRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState message="เกิดข้อผิดพลาด" onRetry={handleRetry} />)

    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
