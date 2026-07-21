import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeField } from './DateRangeField'
import type { DateRangeValue } from '@/utils/dateRange'

// ไม่มีค่าเริ่มต้น (value=null) → Calendar ที่เปิดใน Drawer ไม่มี defaultMonth → fallback ไปเดือน
// "วันนี้" จริง — fix เวลาเป็นค่าคงที่กลาง มิ.ย. 2569 กันเทสต์ไม่ deterministic (testing.md: ห้ามพึ่ง
// new Date() จริง, ใช้ vi.setSystemTime เมื่อจำเป็น) — ไม่เรียก vi.useFakeTimers() เพราะทำให้
// userEvent (ที่พึ่ง real timer สำหรับ pointer/animation ของ Drawer) ค้าง
beforeEach(() => {
  vi.setSystemTime(new Date(2026, 5, 10))
})

afterEach(() => {
  vi.useRealTimers()
})

/** ห่อแบบ controlled จริง (RHF Controller pattern) — onChangeSpy ดักค่าที่ยิงออกไปด้วย */
function ControlledField({
  initial = null,
  onChangeSpy,
}: {
  initial?: DateRangeValue | null
  onChangeSpy?: (value: DateRangeValue | null) => void
}) {
  const [value, setValue] = useState<DateRangeValue | null>(initial)
  return (
    <DateRangeField
      name="dateRange"
      value={value}
      onChange={(next) => {
        setValue(next)
        onChangeSpy?.(next)
      }}
    />
  )
}

describe('DateRangeField', () => {
  it('ไม่มีค่า → ทั้งสองช่องโชว์ placeholder "เลือกวันที่"', () => {
    render(<DateRangeField value={null} onChange={() => undefined} />)

    expect(screen.getAllByText('เลือกวันที่')).toHaveLength(2)
  })

  it('มีค่า → โชว์วันที่แบบไทย พ.ศ. ทั้งสองช่อง', () => {
    render(
      <DateRangeField
        value={{ start: '2026-06-19', end: '2026-06-19' }}
        onChange={() => undefined}
      />,
    )

    expect(screen.getAllByText('19 มิ.ย. 2569')).toHaveLength(2)
  })

  it('กดช่อง "วันที่เริ่ม" → เปิด Drawer ปฏิทิน', async () => {
    const user = userEvent.setup()
    render(<DateRangeField value={null} onChange={() => undefined} />)

    await user.click(screen.getAllByText('เลือกวันที่')[0])

    expect(await screen.findByText('เลือกช่วงวันที่')).toBeInTheDocument()
  })

  it('เลือกวันเดียวในปฏิทินแล้วกดยืนยัน → onChange ได้ start===end (single-day)', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(<ControlledField onChangeSpy={onChangeSpy} />)

    await user.click(screen.getAllByText('เลือกวันที่')[0])
    await user.click(await screen.findByRole('button', { name: /16 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))

    await waitFor(() => {
      expect(onChangeSpy).toHaveBeenCalledWith({ start: '2026-06-16', end: '2026-06-16' })
    })
  })

  it('เลือกช่วงหลายวันแล้วกดยืนยัน → onChange ได้ start/end ตรงช่วงที่เลือก (string YYYY-MM-DD)', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(<ControlledField onChangeSpy={onChangeSpy} />)

    await user.click(screen.getAllByText('เลือกวันที่')[0])
    await user.click(await screen.findByRole('button', { name: /18 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: /21 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))

    await waitFor(() => {
      expect(onChangeSpy).toHaveBeenCalledWith({ start: '2026-06-18', end: '2026-06-21' })
    })
  })

  it('ยังไม่เลือกวัน → ปุ่มยืนยัน disabled', async () => {
    const user = userEvent.setup()
    render(<DateRangeField value={null} onChange={() => undefined} />)

    await user.click(screen.getAllByText('เลือกวันที่')[0])

    expect(await screen.findByRole('button', { name: 'ยืนยัน' })).toBeDisabled()
  })

  it('ปุ่ม + ขยับ "ถึงวันที่" ไปอีก 1 วัน โดยไม่ต้องเปิด Drawer', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(
      <ControlledField initial={{ start: '2026-06-19', end: '2026-06-19' }} onChangeSpy={onChangeSpy} />,
    )

    await user.click(screen.getByRole('button', { name: 'เพิ่มวันที่สิ้นสุดอีก 1 วัน' }))

    expect(onChangeSpy).toHaveBeenCalledWith({ start: '2026-06-19', end: '2026-06-20' })
  })

  it('start===end → ปุ่ม − disabled (กันลดต่ำกว่าวันเริ่ม)', () => {
    render(
      <DateRangeField
        value={{ start: '2026-06-19', end: '2026-06-19' }}
        onChange={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: 'ลดวันที่สิ้นสุดลง 1 วัน' })).toBeDisabled()
  })

  it('ยังไม่มีค่า → ปุ่ม +/− disabled ทั้งคู่', () => {
    render(<DateRangeField value={null} onChange={() => undefined} />)

    expect(screen.getByRole('button', { name: 'ลดวันที่สิ้นสุดลง 1 วัน' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'เพิ่มวันที่สิ้นสุดอีก 1 วัน' })).toBeDisabled()
  })

  it('range > 1 วัน → ปุ่ม − กดได้ ลดวันที่สิ้นสุดลง 1 วัน', async () => {
    const user = userEvent.setup()
    const onChangeSpy = vi.fn()
    render(
      <ControlledField initial={{ start: '2026-06-18', end: '2026-06-21' }} onChangeSpy={onChangeSpy} />,
    )

    await user.click(screen.getByRole('button', { name: 'ลดวันที่สิ้นสุดลง 1 วัน' }))

    expect(onChangeSpy).toHaveBeenCalledWith({ start: '2026-06-18', end: '2026-06-20' })
  })

  it('แสดง error message ที่ส่งเข้ามา', () => {
    render(<DateRangeField value={null} onChange={() => undefined} error="กรุณาเลือกวันที่ลา" />)

    expect(screen.getByText('กรุณาเลือกวันที่ลา')).toBeInTheDocument()
  })

  it('disabled=true → ช่องกดไม่ได้และปุ่ม +/− ปิดหมด', () => {
    render(
      <DateRangeField
        value={{ start: '2026-06-19', end: '2026-06-19' }}
        onChange={() => undefined}
        disabled
      />,
    )

    expect(screen.getAllByText('19 มิ.ย. 2569')[0]?.closest('button')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'เพิ่มวันที่สิ้นสุดอีก 1 วัน' })).toBeDisabled()
  })
})
