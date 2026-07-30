import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BootstrapProgress } from './BootstrapProgress'
import { FOCUS_VISIBLE_RING_CLASS } from './buttonClasses'

describe('BootstrapProgress', () => {
  it('step 1 active: โชว์หัวข้อ, สถานะขั้น 1 active และขั้น 2 pending', () => {
    render(<BootstrapProgress step={1} title="กำลังเชื่อมต่อกับ LINE..." description="กรุณารอสักครู่" />)

    expect(screen.getByText('กำลังเชื่อมต่อกับ LINE...')).toBeInTheDocument()
    expect(screen.getByText('กรุณารอสักครู่')).toBeInTheDocument()
    expect(screen.getByText('เชื่อมต่อกับ LINE')).toBeInTheDocument()
    expect(screen.getByText('กำลังเตรียม LINE LIFF...')).toBeInTheDocument()
    expect(screen.getByText('ตรวจสอบสิทธิ์การเข้าถึง')).toBeInTheDocument()
    expect(screen.getByText('รอดำเนินการ...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('กำลังเตรียม LINE LIFF...')
  })

  it('step 2 active: ขั้น 1 กลายเป็นสำเร็จ ขั้น 2 active', () => {
    render(<BootstrapProgress step={2} title="กำลังตรวจสอบสิทธิ์..." />)

    expect(screen.getByText('สำเร็จ')).toBeInTheDocument()
    // หัวข้อใหญ่กลางจอกับข้อความสถานะแถว active ขั้น 2 เป็นคำเดียวกันตาม spec (จงใจ) — เช็คหัวข้อผ่าน
    // role heading ให้เจาะจง แล้วยืนยันว่าข้อความนี้ขึ้นครบ 2 จุด (หัวข้อ + แถว active)
    expect(screen.getByRole('heading', { level: 1, name: 'กำลังตรวจสอบสิทธิ์...' })).toBeInTheDocument()
    expect(screen.getAllByText('กำลังตรวจสอบสิทธิ์...')).toHaveLength(2)
  })

  it('โหมด error: ไม่มี role status (มีแต่ role alert)', () => {
    render(
      <BootstrapProgress
        step={1}
        title="เปิดแอปไม่สำเร็จ"
        error={{ message: 'เชื่อมต่อ LINE ไม่สำเร็จ' }}
      />,
    )

    expect(screen.getByText('เชื่อมต่อ LINE ไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('เชื่อมต่อ LINE ไม่สำเร็จ')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).not.toBeInTheDocument()
  })

  it('โหมด error ที่มี onRetry: โชว์ปุ่มลองใหม่และเรียก onRetry เมื่อกด', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <BootstrapProgress
        step={2}
        title="เข้าสู่ระบบไม่สำเร็จ"
        error={{ message: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่', onRetry }}
      />,
    )

    const retryButton = screen.getByRole('button', { name: 'ลองใหม่' })
    expect(retryButton.className).toContain(FOCUS_VISIBLE_RING_CLASS)

    await user.click(retryButton)

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
