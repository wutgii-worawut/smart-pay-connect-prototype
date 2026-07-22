import { describe, expect, it } from 'vitest'
import type { Holiday } from '@/types/holiday'
import {
  HOLIDAY_TYPE_LABEL,
  daysUntil,
  formatThaiWeekday,
  generateHolidayYearOptions,
  getNextHoliday,
  splitHolidayDate,
} from './holidays'

const HOLIDAYS: Holiday[] = [
  { date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'government' },
  { date: '2026-04-06', name: 'วันจักรี', type: 'royal' },
  { date: '2026-04-13', name: 'วันสงกรานต์', type: 'government' },
  { date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษาฯ', type: 'royal' },
]

describe('getNextHoliday', () => {
  it('คืนวันหยุดที่ใกล้ที่สุดซึ่ง date >= today', () => {
    const today = new Date(2026, 3, 10) // 2026-04-10
    expect(getNextHoliday(HOLIDAYS, today)).toEqual(HOLIDAYS[2]) // 2026-04-13
  })

  it('today ตรงกับวันหยุดพอดี → นับวันนั้นเป็นวันหยุดถัดไป (inclusive)', () => {
    const today = new Date(2026, 3, 13) // 2026-04-13
    expect(getNextHoliday(HOLIDAYS, today)).toEqual(HOLIDAYS[2])
  })

  it('ไม่มีวันหยุดถัดไป (ทั้งหมดผ่านไปแล้ว) → null', () => {
    const today = new Date(2026, 11, 31) // 2026-12-31
    expect(getNextHoliday(HOLIDAYS, today)).toBeNull()
  })

  it('list ว่าง → null', () => {
    expect(getNextHoliday([], new Date(2026, 0, 1))).toBeNull()
  })

  it('ข้ามปี — เลือกวันหยุดปีถัดไปที่ใกล้สุดได้ถูกต้อง', () => {
    const crossYear: Holiday[] = [
      { date: '2026-12-31', name: 'วันสิ้นปี', type: 'government' },
      { date: '2027-01-01', name: 'วันขึ้นปีใหม่', type: 'government' },
    ]
    const today = new Date(2027, 0, 1) // 2027-01-01
    expect(getNextHoliday(crossYear, today)).toEqual(crossYear[1])
  })
})

describe('daysUntil', () => {
  it('นับจำนวนวันจากวันนี้ถึงวันหยุด', () => {
    expect(daysUntil('2026-07-28', new Date(2026, 5, 15))).toBe(43)
  })

  it('today ตรงกับวันหยุดพอดี → 0', () => {
    expect(daysUntil('2026-07-28', new Date(2026, 6, 28))).toBe(0)
  })

  it('วันหยุดผ่านไปแล้ว → ติดลบ', () => {
    expect(daysUntil('2026-01-01', new Date(2026, 0, 5))).toBe(-4)
  })
})

describe('formatThaiWeekday', () => {
  it('คืนชื่อวันในสัปดาห์ภาษาไทยล้วน ไม่มีคำนำหน้า "วัน"', () => {
    expect(formatThaiWeekday('2026-07-28')).toBe('อังคาร')
    expect(formatThaiWeekday('2026-01-01')).toBe('พฤหัสบดี')
  })
})

describe('splitHolidayDate', () => {
  it('แยกเลขวัน + เดือนย่อไทย', () => {
    expect(splitHolidayDate('2026-07-28')).toEqual({ day: '28', monthShort: 'ก.ค.' })
    expect(splitHolidayDate('2026-01-01')).toEqual({ day: '1', monthShort: 'ม.ค.' })
  })
})

describe('generateHolidayYearOptions', () => {
  it('คืนตัวเลือกปี span*2+1 รายการ value เป็น ค.ศ. label เป็น พ.ศ.', () => {
    const options = generateHolidayYearOptions(2026, 1)
    expect(options).toEqual([
      { value: '2025', label: 'ปี 2568' },
      { value: '2026', label: 'ปี 2569' },
      { value: '2027', label: 'ปี 2570' },
    ])
  })
})

describe('HOLIDAY_TYPE_LABEL', () => {
  it('มี label ไทยครบทั้ง 3 ประเภท', () => {
    expect(HOLIDAY_TYPE_LABEL.government).toBe('วันหยุดราชการ')
    expect(HOLIDAY_TYPE_LABEL.religious).toBe('วันสำคัญศาสนา')
    expect(HOLIDAY_TYPE_LABEL.royal).toBe('วันสำคัญราชวงศ์')
  })
})
