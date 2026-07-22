import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LeaveDayDetailEntry } from '../types/leaveCalendar'
import { LeaveDayDetailSection } from './LeaveDayDetailSection'

describe('LeaveDayDetailSection', () => {
  it('date เป็น null → ไม่ render อะไรเลย', () => {
    const { container } = render(
      <LeaveDayDetailSection date={null} entries={[]} isLoading={false} isError={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('หัวข้อแสดงวันที่ พ.ศ. + จำนวนคนลาถูกต้อง + list ชื่อ+ประเภทลา', () => {
    const entries: LeaveDayDetailEntry[] = [
      { employeeName: 'นายกุหลาบ ประพฤติดี', type: 'vacation', period: 'เต็มวัน' },
      { employeeName: 'นายชล สมมุติ', type: 'vacation', period: 'เต็มวัน' },
    ]
    render(
      <LeaveDayDetailSection date="2026-07-01" entries={entries} isLoading={false} isError={false} />,
    )

    expect(screen.getByText('วันที่ 1 กรกฎาคม 2569 (ลา 2 คน)')).toBeInTheDocument()
    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
    expect(screen.getByText('นายชล สมมุติ')).toBeInTheDocument()
    expect(screen.getAllByText('ลาพักร้อน')).toHaveLength(2)
  })

  it('isLoading=true → แสดง Spinner และหัวข้อไม่โชว์ "(ลา N คน)" ปลอม (M1)', () => {
    render(<LeaveDayDetailSection date="2026-07-01" entries={[]} isLoading isError={false} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('วันที่ 1 กรกฎาคม 2569')).toBeInTheDocument()
    expect(screen.queryByText(/\(ลา/)).not.toBeInTheDocument()
  })

  it('isError=true → แสดงข้อความผิดพลาด + ปุ่มลองใหม่ (ErrorState) หัวข้อไม่โชว์จำนวนคน (M1)', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <LeaveDayDetailSection date="2026-07-01" entries={[]} isLoading={false} isError onRetry={onRetry} />,
    )

    expect(screen.getByText('โหลดรายละเอียดวันที่นี้ไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.getByText('วันที่ 1 กรกฎาคม 2569')).toBeInTheDocument()
    expect(screen.queryByText(/\(ลา/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('entries ว่าง → "ไม่มีคนลาในวันนี้"', () => {
    render(<LeaveDayDetailSection date="2026-07-01" entries={[]} isLoading={false} isError={false} />)
    expect(screen.getByText('ไม่มีคนลาในวันนี้')).toBeInTheDocument()
    expect(screen.getByText('วันที่ 1 กรกฎาคม 2569 (ลา 0 คน)')).toBeInTheDocument()
  })
})
