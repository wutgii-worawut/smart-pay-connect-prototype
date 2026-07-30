import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import liff from '@line/liff'
import { __resetDelayedRevealForTests } from '@/hooks/useDelayedReveal'
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

// เก็บ descriptor เดิมของ window.location ไว้ restore หลังเทสต์ที่ redefine มัน (กันรั่วข้ามไฟล์เทสต์
// อื่นที่รันร่วม suite เดียวกัน — Object.defineProperty แบบไม่ restore จะค้าง reload สปายไว้ถาวร)
const originalLocation = Object.getOwnPropertyDescriptor(window, 'location')

describe('LiffGate', () => {
  beforeEach(() => {
    __resetDelayedRevealForTests()
  })

  afterEach(() => {
    __resetDelayedRevealForTests()
    vi.useRealTimers()
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation)
    }
  })

  it('loading: ก่อนครบ delay ไม่โชว์การ์ด/spinner ไม่ render children', () => {
    renderWithState({ status: 'loading' })

    expect(screen.queryByText('กำลังเชื่อมต่อกับ LINE...')).not.toBeInTheDocument()
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()
  })

  it('loading: หลังครบ delay โชว์การ์ดขั้นตอนการเชื่อมต่อ ไม่ render children', async () => {
    vi.useFakeTimers()
    renderWithState({ status: 'loading' })

    // ต้องห่อ act — setState จาก setTimeout callback ที่ยิงตอน advance fake timer ไม่ได้อยู่ใน React
    // act scope โดยอัตโนมัติ ไม่ห่อแล้ว DOM จะไม่ flush ค่าใหม่ (คงเห็นแค่ div ว่างของช่วงก่อน reveal)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(screen.getByText('กำลังเชื่อมต่อกับ LINE...')).toBeInTheDocument()
    expect(screen.getByText('ขั้นตอนการเชื่อมต่อ')).toBeInTheDocument()
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()
  })

  it('ready: render children', () => {
    renderWithState({ status: 'ready', liff })

    expect(screen.getByText('เนื้อหาแอป')).toBeInTheDocument()
  })

  it('error: แสดงข้อความ error ทันที (ไม่รอ delay) + ปุ่มลองใหม่ที่กดแล้ว reload หน้า', async () => {
    const user = userEvent.setup()
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    })

    renderWithState({ status: 'error', error: new Error('init failed') })

    expect(screen.getByText('เปิดแอปไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.getByText('เชื่อมต่อ LINE ไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})
