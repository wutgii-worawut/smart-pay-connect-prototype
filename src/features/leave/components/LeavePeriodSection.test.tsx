import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeavePeriodSection } from './LeavePeriodSection'
import type { LeaveDayEntry } from '@/types/leave'

describe('LeavePeriodSection', () => {
  it('ไม่มี dateRange → ไม่ render อะไรเลย', () => {
    const { container } = render(
      <LeavePeriodSection dateRange={null} days={[]} holidays={[]} onDaysChange={() => undefined} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('วันเดียว (start===end) → PeriodToggle เดียว (default variant, เต็มความกว้าง) ไม่มีแถววันที่/วันหยุด', () => {
    const days: LeaveDayEntry[] = [{ date: '2026-06-19', period: 'full' }]
    render(
      <LeavePeriodSection
        dateRange={{ start: '2026-06-19', end: '2026-06-19' }}
        days={days}
        holidays={[]}
        onDaysChange={() => undefined}
      />,
    )

    expect(screen.getByRole('radiogroup', { name: /ช่วงเวลาวันที่/ })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3) // เต็มวัน/เช้า/บ่าย
    expect(screen.queryByText('วันหยุด')).not.toBeInTheDocument()
  })

  it('หลายวันคร่อมเสาร์-อาทิตย์ → รวมวันเริ่มเสมอ (กันดัก mockup 6.2 ตกวันเริ่ม) + วันหยุดเป็นแถว disabled', () => {
    // 2026-06-18 (พฤหัส) ถึง 2026-06-21 (อาทิตย์): ทำงาน 18-19, หยุด 20-21
    const days: LeaveDayEntry[] = [
      { date: '2026-06-18', period: 'full' },
      { date: '2026-06-19', period: 'am' },
    ]
    render(
      <LeavePeriodSection
        dateRange={{ start: '2026-06-18', end: '2026-06-21' }}
        days={days}
        holidays={[]}
        onDaysChange={() => undefined}
      />,
    )

    // วันเริ่ม (18) ต้องมีแถว toggle จริง — ไม่ตกหายเหมือนใน mockup
    expect(screen.getByText('18 มิ.ย. 2569')).toBeInTheDocument()
    expect(screen.getByText('19 มิ.ย. 2569')).toBeInTheDocument()
    expect(screen.getByText('20 มิ.ย. 2569')).toBeInTheDocument()
    expect(screen.getByText('21 มิ.ย. 2569')).toBeInTheDocument()

    // 2 แถววันหยุด (เสาร์-อาทิตย์) ไม่มี toggle
    expect(screen.getAllByText('วันหยุด')).toHaveLength(2)
    // 2 แถวทำงาน × 3 ตัวเลือก = 6 radio
    expect(screen.getAllByRole('radio')).toHaveLength(6)
  })

  it('รวมจำนวนวันลาแสดงผลจาก sumLeaveDays (full+am = 1.5)', () => {
    const days: LeaveDayEntry[] = [
      { date: '2026-06-18', period: 'full' },
      { date: '2026-06-19', period: 'am' },
    ]
    render(
      <LeavePeriodSection
        dateRange={{ start: '2026-06-18', end: '2026-06-19' }}
        days={days}
        holidays={[]}
        onDaysChange={() => undefined}
      />,
    )

    expect(screen.getByText('รวมจำนวนวันลา')).toBeInTheDocument()
    expect(screen.getByText('1.5')).toBeInTheDocument()
  })

  it('กด toggle ของแถววันที่ → เรียก onDaysChange พร้อม period ใหม่ของวันนั้นวันเดียว', async () => {
    const user = userEvent.setup()
    const onDaysChange = vi.fn()
    const days: LeaveDayEntry[] = [
      { date: '2026-06-18', period: 'full' },
      { date: '2026-06-19', period: 'full' },
    ]
    render(
      <LeavePeriodSection
        dateRange={{ start: '2026-06-18', end: '2026-06-19' }}
        days={days}
        holidays={[]}
        onDaysChange={onDaysChange}
      />,
    )

    const secondRowRadiogroup = screen.getByRole('radiogroup', { name: /19 มิ.ย. 2569/ })
    await user.click(within(secondRowRadiogroup).getByRole('radio', { name: 'เช้า' }))

    expect(onDaysChange).toHaveBeenCalledWith([
      { date: '2026-06-18', period: 'full' },
      { date: '2026-06-19', period: 'am' },
    ])
  })

  it('วันหยุดบริษัทกลางช่วง (ไม่ใช่เสาร์-อาทิตย์) ก็เป็นแถว disabled "วันหยุด" ด้วย', () => {
    const days: LeaveDayEntry[] = [
      { date: '2026-06-01', period: 'full' },
      { date: '2026-06-03', period: 'full' },
    ]
    render(
      <LeavePeriodSection
        dateRange={{ start: '2026-06-01', end: '2026-06-03' }}
        days={days}
        holidays={['2026-06-02']}
        onDaysChange={() => undefined}
      />,
    )

    expect(screen.getAllByText('วันหยุด')).toHaveLength(1)
    expect(screen.getByText('2 มิ.ย. 2569')).toBeInTheDocument()
  })
})
