import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAttendanceState } from './useAttendanceState'
import type { AttendanceToday } from '../types/attendance'

function makeToday(overrides: Partial<AttendanceToday> = {}): AttendanceToday {
  return {
    clockedIn: false,
    clockedOut: false,
    clockInTime: null,
    clockOutTime: null,
    clockInType: null,
    office: { lat: 13.7563, lng: 100.5018, radiusMeters: 200, name: 'บริษัท คอมพิวเตอร์ จำกัด' },
    canRemoteClock: true,
    date: '2026-07-21',
    ...overrides,
  }
}

describe('useAttendanceState', () => {
  it('อยู่ในรัศมี → in-range-ready, remoteModeSelected เริ่มที่ false', () => {
    const { result } = renderHook(() => useAttendanceState(makeToday(), true))
    expect(result.current.state).toBe('in-range-ready')
    expect(result.current.remoteModeSelected).toBe(false)
  })

  it('นอกรัศมี → out-of-range; แตะ selectRemoteMode → สลับเป็น remote-ready ทันที', () => {
    const { result, rerender } = renderHook(
      ({ today, within }: { today: AttendanceToday; within: boolean | null }) =>
        useAttendanceState(today, within),
      { initialProps: { today: makeToday(), within: false } },
    )

    expect(result.current.state).toBe('out-of-range')

    act(() => {
      result.current.selectRemoteMode()
    })
    rerender({ today: makeToday(), within: false })

    expect(result.current.state).toBe('remote-ready')
    expect(result.current.remoteModeSelected).toBe(true)
  })

  it('clearRemoteMode → กลับไป out-of-range เมื่อยังนอกรัศมี', () => {
    const { result, rerender } = renderHook(
      ({ today, within }: { today: AttendanceToday; within: boolean | null }) =>
        useAttendanceState(today, within),
      { initialProps: { today: makeToday(), within: false } },
    )

    act(() => result.current.selectRemoteMode())
    rerender({ today: makeToday(), within: false })
    expect(result.current.state).toBe('remote-ready')

    act(() => result.current.clearRemoteMode())
    rerender({ today: makeToday(), within: false })
    expect(result.current.state).toBe('out-of-range')
  })

  it('เข้าแล้ว → clocked-in ไม่ว่า remoteModeSelected จะเป็นอะไร', () => {
    const clockedInToday = makeToday({ clockedIn: true, clockInTime: '08:55', clockInType: 'onsite' })
    const { result } = renderHook(() => useAttendanceState(clockedInToday, true))
    expect(result.current.state).toBe('clocked-in')
  })

  it('today ยังไม่มา (undefined) → คืนค่า placeholder in-range-ready ไม่ throw', () => {
    const { result } = renderHook(() => useAttendanceState(undefined, null))
    expect(result.current.state).toBe('in-range-ready')
  })
})
