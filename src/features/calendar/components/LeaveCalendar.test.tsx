import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LeaveMap } from '../types/leaveCalendar'
import { LeaveCalendar } from './LeaveCalendar'

const JUNE_2026 = new Date(2026, 5, 1) // 2026-06-01 เป็นวันจันทร์ (ยืนยันแล้วใน Calendar.test.tsx)

// react-day-picker ใส่ชื่อวันในสัปดาห์ไทยเต็ม (format 'PPPP') นำหน้าเลขวันเสมอ (เช่น
// "วันจันทร์ที่ 1 มิถุนายน 2026") — ต้อง query ด้วยชื่อเต็ม exact ไม่ใช่ regex substring ของแค่เลขวัน
// เพราะเลขวันเดียวเป็น substring ของเลขวันสองหลักได้ (เช่น "1" อยู่ใน "11") ทำให้ query แม่นยำไม่ได้
const JUNE_1_MON = 'วันจันทร์ที่ 1 มิถุนายน 2026'
const JUNE_2_TUE = 'วันอังคารที่ 2 มิถุนายน 2026'
const JUNE_3_WED = 'วันพุธที่ 3 มิถุนายน 2026'
const JUNE_6_SAT = 'วันเสาร์ที่ 6 มิถุนายน 2026'
const JUNE_9_TUE = 'วันอังคารที่ 9 มิถุนายน 2026'
const JUNE_16_TUE_SELECTED = 'วันอังคารที่ 16 มิถุนายน 2026, selected'
const JUNE_18_THU = 'วันพฤหัสบดีที่ 18 มิถุนายน 2026'

beforeEach(() => {
  // "วันนี้" fix ให้ห่างจากปฏิทินที่เทสต์ (มิ.ย. 2026) กันชนกับ modifier `today` (testing.md)
  vi.setSystemTime(new Date('2026-07-22T09:00:00+07:00'))
})
afterEach(() => {
  vi.useRealTimers()
})

/** ห่อแบบ controlled จริง (mode="single" required เสมอ) เหมือนที่ `LeaveCalendarView` ใช้งาน */
function ControlledLeaveCalendar({
  leaveMap,
  onSelectDay,
}: {
  leaveMap: LeaveMap
  onSelectDay?: (date: Date) => void
}) {
  const [selected, setSelected] = useState(new Date(2026, 5, 16))
  return (
    <LeaveCalendar
      leaveMap={leaveMap}
      month={JUNE_2026}
      onMonthChange={() => {}}
      selected={selected}
      onSelectDay={(date) => {
        setSelected(date)
        onSelectDay?.(date)
      }}
    />
  )
}

describe('LeaveCalendar', () => {
  it('วันที่มีประเภทลาเดียว → โชว์จุดสีเดียวถูกประเภท (token bg-leave-*)', () => {
    const leaveMap: LeaveMap = { '2026-06-01': ['vacation'] }
    render(<ControlledLeaveCalendar leaveMap={leaveMap} />)

    const button = screen.getByRole('button', { name: JUNE_1_MON })
    const dots = button.querySelectorAll('span[class*="bg-leave-"]')
    expect(dots).toHaveLength(1)
    expect(dots[0]).toHaveClass('bg-leave-vacation')
  })

  it('วันที่มีหลายประเภทลาซ้อนกัน → โชว์หลายจุดครบทุกประเภท', () => {
    const leaveMap: LeaveMap = { '2026-06-09': ['vacation', 'personal'] }
    render(<ControlledLeaveCalendar leaveMap={leaveMap} />)

    const button = screen.getByRole('button', { name: JUNE_9_TUE })
    const dots = button.querySelectorAll('span[class*="bg-leave-"]')
    expect(dots).toHaveLength(2)
    const dotClasses = Array.from(dots).map((dot) => dot.className)
    expect(dotClasses.some((c) => c.includes('bg-leave-vacation'))).toBe(true)
    expect(dotClasses.some((c) => c.includes('bg-leave-personal'))).toBe(true)
  })

  it('วันที่ไม่มีใครลา → ไม่มีจุดสี', () => {
    render(<ControlledLeaveCalendar leaveMap={{}} />)

    const button = screen.getByRole('button', { name: JUNE_3_WED })
    expect(button.querySelectorAll('span[class*="bg-leave-"]')).toHaveLength(0)
  })

  it('วันเสาร์-อาทิตย์ → เลขวันสีเทา (text-text-secondary)', () => {
    render(<ControlledLeaveCalendar leaveMap={{}} />)

    const saturday = screen.getByRole('button', { name: JUNE_6_SAT })
    expect(saturday).toHaveClass('text-text-secondary')
    expect(saturday).not.toHaveClass('text-text-secondary/50')
  })

  it('วันธรรมดาไม่ได้เลือก → เลขวันสีเข้ม (text-primary-dark) ไม่ใช่สีเทา', () => {
    render(<ControlledLeaveCalendar leaveMap={{}} />)

    const tuesday = screen.getByRole('button', { name: JUNE_2_TUE })
    expect(tuesday).toHaveClass('text-primary-dark')
  })

  it('วันเลือกอยู่ (selected) → วงเขียว border-success', () => {
    render(<ControlledLeaveCalendar leaveMap={{}} />)

    const selectedButton = screen.getByRole('button', { name: JUNE_16_TUE_SELECTED })
    expect(selectedButton).toHaveClass('border-success')
  })

  it('กดวันอื่น → onSelectDay ได้ Date ของวันนั้น', async () => {
    const user = userEvent.setup()
    const onSelectDay = vi.fn()
    render(<ControlledLeaveCalendar leaveMap={{}} onSelectDay={onSelectDay} />)

    await user.click(screen.getByRole('button', { name: JUNE_18_THU }))

    expect(onSelectDay).toHaveBeenCalledTimes(1)
    const picked = onSelectDay.mock.calls[0]?.[0] as Date
    expect(picked.getDate()).toBe(18)
  })

  it('leaveMap prop เปลี่ยน (re-render) → DOM node ของ DayButton ไม่ remount (กับดัก P7 #1: ต้องใช้ Context ไม่ใช่ inline arrow)', () => {
    const { rerender } = render(
      <LeaveCalendar
        leaveMap={{}}
        month={JUNE_2026}
        onMonthChange={vi.fn()}
        selected={new Date(2026, 5, 16)}
        onSelectDay={vi.fn()}
      />,
    )

    const buttonBefore = screen.getByRole('button', { name: JUNE_16_TUE_SELECTED })
    buttonBefore.focus()
    expect(document.activeElement).toBe(buttonBefore)

    rerender(
      <LeaveCalendar
        leaveMap={{ '2026-06-16': ['sick'] }}
        month={JUNE_2026}
        onMonthChange={vi.fn()}
        selected={new Date(2026, 5, 16)}
        onSelectDay={vi.fn()}
      />,
    )

    const buttonAfter = screen.getByRole('button', { name: JUNE_16_TUE_SELECTED })
    // node เดิมตัวเดียวกัน (ไม่ remount) และ focus ไม่หลุด — ถ้า DayButton เป็น inline arrow
    // react-day-picker จะมองว่าเป็น component คนละตัวทุก render แล้ว remount ทั้ง grid ทำให้ 2 เงื่อนไขนี้ล้ม
    expect(buttonAfter).toBe(buttonBefore)
    expect(document.activeElement).toBe(buttonBefore)
    expect(buttonAfter.querySelectorAll('span[class*="bg-leave-"]')).toHaveLength(1)
  })
})
