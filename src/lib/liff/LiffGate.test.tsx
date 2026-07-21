import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import liff from '@line/liff'
import { LiffContext, type LiffState } from './liff-context'
import { LiffGate } from './LiffGate'

function renderWithState(state: LiffState) {
  return render(
    <LiffContext value={state}>
      <LiffGate>
        <p>เนื้อหาแอป</p>
      </LiffGate>
    </LiffContext>,
  )
}

describe('LiffGate', () => {
  it('loading: แสดงข้อความกำลังโหลด ไม่ render children', () => {
    renderWithState({ status: 'loading' })

    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument()
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()
  })

  it('ready: render children', () => {
    renderWithState({ status: 'ready', liff })

    expect(screen.getByText('เนื้อหาแอป')).toBeInTheDocument()
  })

  it('error: แสดงข้อความ error + ปุ่มลองใหม่ที่กดแล้ว reload หน้า', async () => {
    const user = userEvent.setup()
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    })

    renderWithState({ status: 'error', error: new Error('init failed') })

    expect(screen.getByText('เปิดแอปไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})
