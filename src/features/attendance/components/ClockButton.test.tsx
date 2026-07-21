import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClockButton } from './ClockButton'

describe('ClockButton', () => {
  it('in-range-ready → ปุ่มกดได้ ข้อความ "เข้างาน" เรียก onClick เมื่อกด', async () => {
    const onClick = vi.fn()
    render(<ClockButton state="in-range-ready" isPending={false} onClick={onClick} />)

    const button = screen.getByRole('button', { name: /เข้างาน/ })
    expect(button).toBeEnabled()

    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('out-of-range → ปุ่ม disabled กดไม่ได้ (state table feature-plans/02)', async () => {
    const onClick = vi.fn()
    render(<ClockButton state="out-of-range" isPending={false} onClick={onClick} />)

    const button = screen.getByRole('button', { name: /ลงเวลา/ })
    expect(button).toBeDisabled()

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('remote-ready → ปุ่มกดได้ ข้อความ "ลงเวลา"', () => {
    render(<ClockButton state="remote-ready" isPending={false} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /ลงเวลา/ })).toBeEnabled()
  })

  it('clocked-in → ปุ่มกดได้ ข้อความ "ออกงาน"', () => {
    render(<ClockButton state="clocked-in" isPending={false} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /ออกงาน/ })).toBeEnabled()
  })

  it('completed → ปุ่ม disabled ข้อความ "ลงเวลาออกงานแล้ว"', () => {
    render(<ClockButton state="completed" isPending={false} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /ลงเวลาออกงานแล้ว/ })).toBeDisabled()
  })

  it('isPending=true → disabled เสมอไม่ว่า state ไหน (กันกดซ้ำระหว่างส่ง §20.4) และไม่เรียก onClick ซ้ำ', async () => {
    const onClick = vi.fn()
    render(<ClockButton state="in-range-ready" isPending={true} onClick={onClick} />)

    const button = screen.getByRole('button', { name: /เข้างาน/ })
    expect(button).toBeDisabled()

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
