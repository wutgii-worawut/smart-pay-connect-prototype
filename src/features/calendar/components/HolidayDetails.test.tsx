import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Holiday } from '@/types/holiday'
import { HolidayDetails } from './HolidayDetails'

const HOLIDAY: Holiday = {
  date: '2026-07-28',
  name: 'วันเฉลิมพระชนมพรรษาฯ',
  nameEn: "H.M. King's Birthday",
  type: 'royal',
  description: 'พระบาทสมเด็จพระเจ้าอยู่หัว',
}

describe('HolidayDetails', () => {
  it('holiday=null → ไม่ render อะไร', () => {
    const { container } = render(<HolidayDetails holiday={null} open={false} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('open=true → แสดง 3 DetailField (วันที่/ตรงกับ/ประเภท) + กล่อง description + ปุ่มปิด', () => {
    render(<HolidayDetails holiday={HOLIDAY} open onClose={vi.fn()} />)

    expect(screen.getByText('วันที่')).toBeInTheDocument()
    expect(screen.getByText('28 กรกฎาคม 2569')).toBeInTheDocument()
    expect(screen.getByText('ตรงกับ')).toBeInTheDocument()
    expect(screen.getByText('วันอังคาร')).toBeInTheDocument()
    expect(screen.getByText('ประเภท')).toBeInTheDocument()
    expect(screen.getAllByText('วันสำคัญราชวงศ์').length).toBeGreaterThan(0)
    expect(screen.getByText('พระบาทสมเด็จพระเจ้าอยู่หัว')).toBeInTheDocument()
    // 2 ปุ่มชื่อ "ปิด": ปุ่ม X ของ Drawer (aria-label) + ปุ่ม "ปิด" ท้ายเนื้อหา
    expect(screen.getAllByRole('button', { name: 'ปิด' })).toHaveLength(2)
  })

  it('กดปุ่ม "ปิด" ท้ายเนื้อหา → เรียก onClose', async () => {
    const onClose = vi.fn()
    render(<HolidayDetails holiday={HOLIDAY} open onClose={onClose} />)

    const closeButtons = screen.getAllByRole('button', { name: 'ปิด' })
    await userEvent.click(closeButtons[closeButtons.length - 1])
    expect(onClose).toHaveBeenCalled()
  })

  it('ไม่มี description → ไม่แสดงกล่อง info', () => {
    render(
      <HolidayDetails
        holiday={{ date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'government' }}
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText('พระบาทสมเด็จพระเจ้าอยู่หัว')).not.toBeInTheDocument()
  })
})
