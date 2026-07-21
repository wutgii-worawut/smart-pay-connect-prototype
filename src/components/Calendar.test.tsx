import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DateRange } from 'react-day-picker'
import { Calendar } from './Calendar'

/** ห่อ Calendar mode="range" แบบ controlled จริง (เหมือนที่ DateRangeField ใช้งาน) — ทดสอบ
 * การสะสมช่วงข้าม 2 คลิกได้ถูก (react-day-picker เป็น controlled component ล้วน ต้องป้อน
 * `selected` กลับเข้าไปทุกครั้งที่ onSelect ไม่งั้นแต่ละคลิกจะเห็นเป็นคลิกแรกเสมอ) */
function ControlledRangeCalendar({ onSelect }: { onSelect: (range: DateRange | undefined) => void }) {
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  return (
    <Calendar
      mode="range"
      defaultMonth={new Date(2026, 5, 1)}
      selected={range}
      onSelect={(next) => {
        setRange(next)
        onSelect(next)
      }}
    />
  )
}

describe('Calendar', () => {
  it('MonthCaption แสดง "มิถุนายน" + "พ.ศ. 2569" (ค.ศ. 2026 → พ.ศ. 2569, DoD หัวปฏิทิน)', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 5, 1)} />)

    expect(screen.getByText('มิถุนายน')).toBeInTheDocument()
    expect(screen.getByText('พ.ศ. 2569')).toBeInTheDocument()
  })

  it('แสดงหัวคอลัมน์วันภาษาไทยครบ อา.-ส. (weekStartsOn=0 ตาม locale th)', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 5, 1)} />)

    expect(screen.getByText('อา.')).toBeInTheDocument()
    expect(screen.getByText('จ.')).toBeInTheDocument()
    expect(screen.getByText('ส.')).toBeInTheDocument()
  })

  it('วันของเดือนอื่น (outside) ไม่โชว์ปุ่ม (showOutsideDays=false)', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 5, 1)} />)

    // 2026-06-01 เป็นวันจันทร์ → ไม่มีปุ่มของเดือนพฤษภาคมโผล่มาก่อนวันที่ 1
    expect(screen.queryByRole('button', { name: /31 พฤษภาคม/ })).not.toBeInTheDocument()
  })

  it('กดปุ่ม "เดือนถัดไป" → เปลี่ยนหัวปฏิทินเป็นเดือนถัดไป', async () => {
    const user = userEvent.setup()
    render(<Calendar mode="single" defaultMonth={new Date(2026, 5, 1)} />)

    await user.click(screen.getByRole('button', { name: 'เดือนถัดไป' }))

    expect(screen.getByText('กรกฎาคม')).toBeInTheDocument()
    expect(screen.queryByText('มิถุนายน')).not.toBeInTheDocument()
  })

  it('mode single: กดวันที่ → onSelect ได้ Date ของวันนั้น', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Calendar mode="single" defaultMonth={new Date(2026, 5, 1)} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /16 มิถุนายน 2026/ }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    const selected = onSelect.mock.calls[0]?.[0] as Date
    expect(selected.getFullYear()).toBe(2026)
    expect(selected.getMonth()).toBe(5)
    expect(selected.getDate()).toBe(16)
  })

  it('วันที่ selected ได้ ring วงเขียว (border-success ตาม feature-plans/06 §6.1)', () => {
    render(<Calendar mode="single" selected={new Date(2026, 5, 16)} defaultMonth={new Date(2026, 5, 1)} />)

    const button = screen.getByRole('button', { name: /16 มิถุนายน 2026/ })
    expect(button).toHaveClass('border-success')
  })

  it('รองรับ mode="range" (controlled ตามที่ DateRangeField ใช้จริง): กด 2 วัน → สะสมเป็น {from,to}', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ControlledRangeCalendar onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /18 มิถุนายน 2026/ }))
    await user.click(screen.getByRole('button', { name: /21 มิถุนายน 2026/ }))

    const lastCall = onSelect.mock.calls.at(-1)?.[0] as DateRange
    expect(lastCall.from?.getDate()).toBe(18)
    expect(lastCall.to?.getDate()).toBe(21)
  })

  it('รองรับ override components.DayButton (สัญญาที่ P18 LeaveCalendar จะใช้ต่อ)', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 5, 1)}
        components={{
          DayButton: (props) => (
            <button
              type="button"
              onClick={props.onClick}
              data-testid={`custom-day-${props.day.date.getDate()}`}
            >
              custom-{props.day.date.getDate()}
            </button>
          ),
        }}
      />,
    )

    expect(screen.getByTestId('custom-day-16')).toHaveTextContent('custom-16')
  })
})
