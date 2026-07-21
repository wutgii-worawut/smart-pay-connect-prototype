import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useResendCountdown } from './useResendCountdown'

describe('useResendCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('เริ่มต้นด้วยค่าที่ตั้ง + isReady false', () => {
    const { result } = renderHook(() => useResendCountdown(5))

    expect(result.current.remaining).toBe(5)
    expect(result.current.isReady).toBe(false)
  })

  it('นับถอยหลังทีละวินาที จนถึง 0 แล้ว isReady true', () => {
    const { result } = renderHook(() => useResendCountdown(3))

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(2)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remaining).toBe(0)
    expect(result.current.isReady).toBe(true)

    // ไม่ติดลบเมื่อเวลาผ่านไปอีก
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(0)
  })

  it('reset() เริ่มนับใหม่จากค่าเดิม (ไม่ส่ง param)', () => {
    const { result } = renderHook(() => useResendCountdown(3))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.isReady).toBe(true)

    act(() => {
      result.current.reset()
    })
    expect(result.current.remaining).toBe(3)
    expect(result.current.isReady).toBe(false)
  })

  it('reset(seconds) เริ่มนับใหม่ด้วยค่าที่ระบุ', () => {
    const { result } = renderHook(() => useResendCountdown(3))

    act(() => {
      result.current.reset(10)
    })
    expect(result.current.remaining).toBe(10)
  })

  it('forceReady() ทำให้ isReady ทันทีโดยไม่ต้องรอ (เคส OTP_EXPIRED)', () => {
    const { result } = renderHook(() => useResendCountdown(60))

    expect(result.current.isReady).toBe(false)

    act(() => {
      result.current.forceReady()
    })
    expect(result.current.remaining).toBe(0)
    expect(result.current.isReady).toBe(true)
  })
})
