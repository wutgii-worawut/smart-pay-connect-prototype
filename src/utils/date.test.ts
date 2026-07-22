import { describe, expect, it } from 'vitest'
import {
  formatLeaveDayLine,
  formatThaiDate,
  formatThaiDateRange,
  formatThaiMonthCaption,
  listLeaveWorkingDays,
  sumLeaveDays,
  toBuddhistYear,
} from './date'
import type { LeaveDayEntry } from '@/types/leave'

describe('formatThaiDate', () => {
  it('แสดง d-MMM-yyyy (ค่าเริ่มต้น) เป็น พ.ศ. จาก string YYYY-MM-DD', () => {
    expect(formatThaiDate('2026-06-01')).toBe('1 มิ.ย. 2569')
  })

  it('แสดง d-MMMM-yyyy เต็มเดือน', () => {
    expect(formatThaiDate('2026-06-01', 'd-MMMM-yyyy')).toBe('1 มิถุนายน 2569')
  })

  it('แสดง MMMM-yyyy พร้อมคำว่า พ.ศ.', () => {
    expect(formatThaiDate('2026-06-01', 'MMMM-yyyy')).toBe('มิถุนายน พ.ศ. 2569')
  })

  it('รับ Date object ได้เหมือนกับ string', () => {
    const d = new Date(2026, 5, 1) // local June 1, 2026
    expect(formatThaiDate(d)).toBe('1 มิ.ย. 2569')
  })

  it('ปีข้ามเหลื่อม (ธ.ค. -> ม.ค.) คำนวณ พ.ศ. ถูกต้อง', () => {
    expect(formatThaiDate('2026-12-31')).toBe('31 ธ.ค. 2569')
    expect(formatThaiDate('2027-01-01')).toBe('1 ม.ค. 2570')
  })
})

describe('formatThaiMonthCaption', () => {
  it('มิถุนายน 2026 (ค.ศ.) → เดือน "มิถุนายน" + ปี "พ.ศ. 2569" (DoD: หัวปฏิทิน)', () => {
    expect(formatThaiMonthCaption(new Date(2026, 5, 1))).toEqual({
      month: 'มิถุนายน',
      yearBe: 'พ.ศ. 2569',
    })
  })

  it('ธันวาคม → มกราคมปีถัดไป คำนวณ พ.ศ. ข้ามปีถูกต้อง', () => {
    expect(formatThaiMonthCaption(new Date(2026, 11, 1))).toEqual({
      month: 'ธันวาคม',
      yearBe: 'พ.ศ. 2569',
    })
    expect(formatThaiMonthCaption(new Date(2027, 0, 1))).toEqual({
      month: 'มกราคม',
      yearBe: 'พ.ศ. 2570',
    })
  })
})

describe('toBuddhistYear', () => {
  it('บวก 543 ตรงไปตรงมา', () => {
    expect(toBuddhistYear(2026)).toBe(2569)
  })

  it('ปีอื่นก็บวก 543 เหมือนกัน', () => {
    expect(toBuddhistYear(2000)).toBe(2543)
  })
})

describe('formatThaiDateRange', () => {
  it('วันเดียว (start===end) → เหมือน formatThaiDate ปกติ', () => {
    expect(formatThaiDateRange('2026-06-08', '2026-06-08')).toBe('8 มิ.ย. 2569')
  })

  it('หลายวัน เดือน/ปีเดียวกัน → "16–17 มิ.ย. 2569"', () => {
    expect(formatThaiDateRange('2026-06-16', '2026-06-17')).toBe('16–17 มิ.ย. 2569')
  })

  it('คร่อมเดือน → แสดงเต็มทั้งสองฝั่ง', () => {
    expect(formatThaiDateRange('2026-06-29', '2026-07-03')).toBe('29 มิ.ย. 2569–3 ก.ค. 2569')
  })

  it('คร่อมปี → แสดงเต็มทั้งสองฝั่งรวม พ.ศ. ต่างกัน', () => {
    expect(formatThaiDateRange('2026-12-30', '2027-01-02')).toBe('30 ธ.ค. 2569–2 ม.ค. 2570')
  })
})

describe('formatLeaveDayLine', () => {
  it('เต็มวัน (full) → ไม่มีคำต่อท้าย', () => {
    expect(formatLeaveDayLine({ date: '2026-05-12', period: 'full' })).toBe('12 พ.ค. 2569')
  })

  it('ครึ่งเช้า (am) → ต่อท้าย "เช้า"', () => {
    expect(formatLeaveDayLine({ date: '2026-05-13', period: 'am' })).toBe('13 พ.ค. 2569 เช้า')
  })

  it('ครึ่งบ่าย (pm) → ต่อท้าย "บ่าย"', () => {
    expect(formatLeaveDayLine({ date: '2026-05-14', period: 'pm' })).toBe('14 พ.ค. 2569 บ่าย')
  })
})

describe('listLeaveWorkingDays', () => {
  it('วันเดียว วันธรรมดา ไม่มีวันหยุด → รายการมี 1 วัน', () => {
    // 2026-06-01 = วันจันทร์
    expect(listLeaveWorkingDays('2026-06-01', '2026-06-01', [])).toEqual(['2026-06-01'])
  })

  it('คร่อมเสาร์อาทิตย์ กรองเสาร์-อาทิตย์ออกให้เหลือแค่วันทำงาน', () => {
    // 2026-06-01 (จันทร์) ถึง 2026-06-07 (อาทิตย์): เหลือ จ-ศ = 01-05, เสาร์06/อาทิตย์07 ถูกกรอง
    expect(listLeaveWorkingDays('2026-06-01', '2026-06-07', [])).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
    ])
  })

  it('หักวันหยุดบริษัทที่ตกในช่วงวันทำงาน', () => {
    // 2026-06-01 (จันทร์) ถึง 2026-06-05 (ศุกร์), หักวันหยุด 2026-06-03 (พุธ)
    expect(listLeaveWorkingDays('2026-06-01', '2026-06-05', ['2026-06-03'])).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-04',
      '2026-06-05',
    ])
  })

  it('holidays ที่อยู่นอกช่วงวันที่ขอ ไม่มีผลกระทบ', () => {
    expect(listLeaveWorkingDays('2026-06-01', '2026-06-02', ['2026-06-10'])).toEqual([
      '2026-06-01',
      '2026-06-02',
    ])
  })

  it('start เป็นวันเสาร์-อาทิตย์ ไม่ถูกรวมในผลลัพธ์', () => {
    // 2026-06-06 (เสาร์) ถึง 2026-06-08 (จันทร์) → เหลือแค่วันจันทร์
    expect(listLeaveWorkingDays('2026-06-06', '2026-06-08', [])).toEqual(['2026-06-08'])
  })

  it('start เป็นวันหยุดบริษัท ไม่ถูกรวมในผลลัพธ์', () => {
    // 2026-06-01 (จันทร์, วันหยุด) ถึง 2026-06-02 (อังคาร) → เหลือแค่ 06-02
    expect(listLeaveWorkingDays('2026-06-01', '2026-06-02', ['2026-06-01'])).toEqual([
      '2026-06-02',
    ])
  })

  it('ข้ามเดือน นับวันทำงานถูกต้อง', () => {
    // 2026-06-29 (จันทร์) ถึง 2026-07-03 (ศุกร์) = 5 วันทำงานติดกัน ไม่มีเสาร์อาทิตย์คั่น
    expect(listLeaveWorkingDays('2026-06-29', '2026-07-03', [])).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ])
  })

  it('ข้ามปี นับวันทำงานถูกต้อง', () => {
    // 2026-12-28 (จันทร์) ถึง 2027-01-01 (ศุกร์) = 5 วันทำงาน ไม่มีเสาร์อาทิตย์คั่น
    expect(listLeaveWorkingDays('2026-12-28', '2027-01-01', [])).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
    ])
  })

  it('end < start → คืน [] ไม่ throw', () => {
    expect(listLeaveWorkingDays('2026-06-05', '2026-06-01', [])).toEqual([])
  })

  it('ช่วงทั้งหมดเป็นเสาร์อาทิตย์ → คืน []', () => {
    // 2026-06-06 (เสาร์) ถึง 2026-06-07 (อาทิตย์)
    expect(listLeaveWorkingDays('2026-06-06', '2026-06-07', [])).toEqual([])
  })
})

describe('sumLeaveDays', () => {
  it('array ว่าง → 0', () => {
    expect(sumLeaveDays([])).toBe(0)
  })

  it('เต็มวันเดียว (full) → 1', () => {
    const days: LeaveDayEntry[] = [{ date: '2026-06-01', period: 'full' }]
    expect(sumLeaveDays(days)).toBe(1)
  })

  it('ครึ่งเช้าวันเดียว (am) → 0.5', () => {
    const days: LeaveDayEntry[] = [{ date: '2026-06-01', period: 'am' }]
    expect(sumLeaveDays(days)).toBe(0.5)
  })

  it('ครึ่งบ่ายวันเดียว (pm) → 0.5', () => {
    const days: LeaveDayEntry[] = [{ date: '2026-06-01', period: 'pm' }]
    expect(sumLeaveDays(days)).toBe(0.5)
  })

  it('ผสมกัน [full, am, full] → 2.5 (เคสตาม design 6.2)', () => {
    const days: LeaveDayEntry[] = [
      { date: '2026-06-01', period: 'full' },
      { date: '2026-06-02', period: 'am' },
      { date: '2026-06-03', period: 'full' },
    ]
    expect(sumLeaveDays(days)).toBe(2.5)
  })

  it('หลายวันเต็ม → รวมตรง', () => {
    const days: LeaveDayEntry[] = [
      { date: '2026-06-01', period: 'full' },
      { date: '2026-06-02', period: 'full' },
      { date: '2026-06-03', period: 'full' },
    ]
    expect(sumLeaveDays(days)).toBe(3)
  })
})
