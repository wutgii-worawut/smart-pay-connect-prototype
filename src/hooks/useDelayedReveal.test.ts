import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDelayedReveal, __resetDelayedRevealForTests } from './useDelayedReveal'

describe('useDelayedReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    __resetDelayedRevealForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    __resetDelayedRevealForTests()
  })

  it('คืน false ก่อนครบเวลา', () => {
    const { result } = renderHook(() => useDelayedReveal(300))

    expect(result.current).toBe(false)
  })

  it('คืน true หลังครบเวลา', () => {
    const { result } = renderHook(() => useDelayedReveal(300))

    // ต้องห่อ act — setState ที่เกิดจาก setTimeout callback (ถูกยิงตอน advance fake timer) ไม่ได้อยู่
    // ใน React act scope โดยอัตโนมัติ ไม่ห่อแล้ว state จะไม่ flush ให้ result.current เห็นค่าใหม่
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe(true)
  })

  it('mount ที่สองหลัง reveal ครั้งแรกแล้ว ได้ true ทันทีไม่ต้องรอ delay ซ้ำ (latch ระดับโมดูล)', () => {
    const first = renderHook(() => useDelayedReveal(300))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(first.result.current).toBe(true)
    first.unmount()

    const second = renderHook(() => useDelayedReveal(300))

    expect(second.result.current).toBe(true)
  })

  it('unmount ก่อนครบเวลา ไม่ setState หลัง unmount (ไม่ throw)', () => {
    const { unmount } = renderHook(() => useDelayedReveal(300))

    unmount()

    expect(() => vi.advanceTimersByTime(300)).not.toThrow()
  })
})
