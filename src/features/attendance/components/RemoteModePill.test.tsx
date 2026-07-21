import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RemoteModePill } from './RemoteModePill'

describe('RemoteModePill', () => {
  it('active=false → แตะได้ เรียก onClick (out-of-range เปิดทางเลือกโหมด remote)', async () => {
    const onClick = vi.fn()
    render(<RemoteModePill active={false} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: /ไปทำงานนอกสถานที่/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('active=true + disabled → แตะไม่เรียก onClick (remote-ready, เลือกไว้แล้ว)', async () => {
    const onClick = vi.fn()
    render(<RemoteModePill active onClick={onClick} disabled />)

    const button = screen.getByRole('button', { name: /ไปทำงานนอกสถานที่/ })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
