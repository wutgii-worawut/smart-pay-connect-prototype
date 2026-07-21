import { describe, expect, it } from 'vitest'
import { deriveAttendanceState } from './deriveAttendanceState'
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

describe('deriveAttendanceState', () => {
  it('ยังไม่เข้า + อยู่ในรัศมี → in-range-ready (จอ 1)', () => {
    const state = deriveAttendanceState({
      today: makeToday(),
      isWithinRadius: true,
      remoteModeSelected: false,
    })
    expect(state).toBe('in-range-ready')
  })

  it('ยังไม่ทราบตำแหน่ง (ยังไม่กด/ยังไม่ขอ GPS) → in-range-ready เช่นกัน (ปุ่มต้องกดได้ก่อนไปเช็คตอนกด §15)', () => {
    const state = deriveAttendanceState({
      today: makeToday(),
      isWithinRadius: null,
      remoteModeSelected: false,
    })
    expect(state).toBe('in-range-ready')
  })

  it('ยังไม่เข้า + นอกรัศมี + ยังไม่เลือกโหมด remote → out-of-range (จอ 0)', () => {
    const state = deriveAttendanceState({
      today: makeToday(),
      isWithinRadius: false,
      remoteModeSelected: false,
    })
    expect(state).toBe('out-of-range')
  })

  it('ผู้ใช้เลือกโหมดนอกสถานที่ (แม้ยังนอกรัศมี) → remote-ready (จอ 6)', () => {
    const state = deriveAttendanceState({
      today: makeToday(),
      isWithinRadius: false,
      remoteModeSelected: true,
    })
    expect(state).toBe('remote-ready')
  })

  it('เข้าแล้ว ยังไม่ออก → clocked-in (จอ 3/8) ไม่ว่าจะเลือกโหมด remote หรือรัศมีเป็นอย่างไร', () => {
    const state = deriveAttendanceState({
      today: makeToday({ clockedIn: true, clockInTime: '08:55', clockInType: 'onsite' }),
      isWithinRadius: false,
      remoteModeSelected: true,
    })
    expect(state).toBe('clocked-in')
  })

  it('เข้า-ออกครบวันแล้ว → completed (จอ 5) แม้ remoteModeSelected ยังค้าง true', () => {
    const state = deriveAttendanceState({
      today: makeToday({
        clockedIn: true,
        clockedOut: true,
        clockInTime: '08:55',
        clockOutTime: '18:02',
        clockInType: 'onsite',
      }),
      isWithinRadius: true,
      remoteModeSelected: true,
    })
    expect(state).toBe('completed')
  })
})
