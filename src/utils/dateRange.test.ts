import { describe, expect, it } from 'vitest'
import { dateRangeToValue, shiftRangeEnd, valueToDateRange } from './dateRange'

describe('dateRangeToValue', () => {
  it('range ไม่มี from เลย → null', () => {
    expect(dateRangeToValue(undefined)).toBeNull()
    expect(dateRangeToValue({ from: undefined })).toBeNull()
  })

  it('เลือกวันเดียว (มี from ไม่มี to) → start===end (single-day, design 6.1)', () => {
    const range = { from: new Date(2026, 5, 19) } // 19 มิ.ย. 2569
    expect(dateRangeToValue(range)).toEqual({ start: '2026-06-19', end: '2026-06-19' })
  })

  it('เลือกช่วงหลายวัน → start/end ตรง react-day-picker range', () => {
    const range = { from: new Date(2026, 5, 18), to: new Date(2026, 5, 21) }
    expect(dateRangeToValue(range)).toEqual({ start: '2026-06-18', end: '2026-06-21' })
  })

  it('ช่วงคร่อมเดือน (ข้ามเดือน) → format ถูกทั้งสองฝั่ง', () => {
    const range = { from: new Date(2026, 5, 29), to: new Date(2026, 6, 3) }
    expect(dateRangeToValue(range)).toEqual({ start: '2026-06-29', end: '2026-07-03' })
  })

  it('ช่วงคร่อมปี → format ถูกทั้งสองฝั่ง', () => {
    const range = { from: new Date(2026, 11, 30), to: new Date(2027, 0, 2) }
    expect(dateRangeToValue(range)).toEqual({ start: '2026-12-30', end: '2027-01-02' })
  })

  it('ไม่มี off-by-one จาก timezone: เที่ยงคืนวันสุดท้ายเดือน กับต้นเดือนถัดไป format ตรงเป๊ะ', () => {
    // เดือนกุมภาพันธ์ปีอธิกสุรทิน (2028) มี 29 วัน — เคสที่ off-by-one มักหลุดให้เห็น
    const range = { from: new Date(2028, 1, 28), to: new Date(2028, 1, 29) }
    expect(dateRangeToValue(range)).toEqual({ start: '2028-02-28', end: '2028-02-29' })
  })
})

describe('valueToDateRange', () => {
  it('null/undefined → undefined', () => {
    expect(valueToDateRange(null)).toBeUndefined()
    expect(valueToDateRange(undefined)).toBeUndefined()
  })

  it('single-day value → from และ to เป็นวันเดียวกัน (local date ไม่ใช่ UTC เที่ยงคืน)', () => {
    const result = valueToDateRange({ start: '2026-06-19', end: '2026-06-19' })
    expect(result?.from).toEqual(new Date(2026, 5, 19))
    expect(result?.to).toEqual(new Date(2026, 5, 19))
  })

  it('range หลายวัน → from/to parse ถูกต้อง ไม่มี off-by-one', () => {
    const result = valueToDateRange({ start: '2026-06-18', end: '2026-06-21' })
    expect(result?.from).toEqual(new Date(2026, 5, 18))
    expect(result?.to).toEqual(new Date(2026, 5, 21))
  })

  it('round-trip: value → DateRange → value ได้ค่าเดิม', () => {
    const original = { start: '2026-12-31', end: '2027-01-01' }
    const range = valueToDateRange(original)
    expect(dateRangeToValue(range)).toEqual(original)
  })
})

describe('shiftRangeEnd', () => {
  it('เพิ่ม end ทีละ 1 วัน (ปุ่ม + ใต้ "ถึงวันที่")', () => {
    expect(shiftRangeEnd({ start: '2026-06-19', end: '2026-06-19' }, 1)).toEqual({
      start: '2026-06-19',
      end: '2026-06-20',
    })
  })

  it('ลด end ทีละ 1 วัน (ปุ่ม −) เมื่อยังเหลือช่วงมากกว่า 1 วัน', () => {
    expect(shiftRangeEnd({ start: '2026-06-18', end: '2026-06-21' }, -1)).toEqual({
      start: '2026-06-18',
      end: '2026-06-20',
    })
  })

  it('start===end แล้วลดต่อ → clamp ไม่ให้ end ก่อน start', () => {
    expect(shiftRangeEnd({ start: '2026-06-19', end: '2026-06-19' }, -1)).toEqual({
      start: '2026-06-19',
      end: '2026-06-19',
    })
  })

  it('เพิ่มข้ามเดือน → format ถูก ไม่มี off-by-one', () => {
    expect(shiftRangeEnd({ start: '2026-06-29', end: '2026-06-30' }, 1)).toEqual({
      start: '2026-06-29',
      end: '2026-07-01',
    })
  })
})
