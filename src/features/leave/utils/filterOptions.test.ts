import { describe, expect, it } from 'vitest'
import {
  MONTH_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  generateYearFilterOptions,
  toStatusParam,
  toTypeParam,
} from './filterOptions'

describe('TYPE_FILTER_OPTIONS', () => {
  it('เรียงตาม design: ทั้งหมด, ลาป่วย, ลาพักร้อน, ลากิจ', () => {
    expect(TYPE_FILTER_OPTIONS.map((o) => o.value)).toEqual(['all', 'sick', 'vacation', 'personal'])
  })
})

describe('STATUS_FILTER_OPTIONS', () => {
  it('มีครบ 5 ตัวเลือก (ทั้งหมด + 4 สถานะ)', () => {
    expect(STATUS_FILTER_OPTIONS).toHaveLength(5)
    expect(STATUS_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'ทั้งหมด' })
  })
})

describe('MONTH_FILTER_OPTIONS', () => {
  it('มี 13 ตัวเลือก (ทั้งหมด + 12 เดือน) เรียง ม.ค.-ธ.ค.', () => {
    expect(MONTH_FILTER_OPTIONS).toHaveLength(13)
    expect(MONTH_FILTER_OPTIONS[1]).toEqual({ value: '1', label: 'มกราคม' })
    expect(MONTH_FILTER_OPTIONS[6]).toEqual({ value: '6', label: 'มิถุนายน' })
    expect(MONTH_FILTER_OPTIONS[12]).toEqual({ value: '12', label: 'ธันวาคม' })
  })
})

describe('generateYearFilterOptions', () => {
  it('ตัวเลือกแรกเป็น "ทั้งหมด" เสมอ', () => {
    const options = generateYearFilterOptions(2026)
    expect(options[0]).toEqual({ value: 'all', label: 'ทั้งหมด' })
  })

  it('ปีอ้างอิง ค.ศ. 2026 → value ค.ศ. label พ.ศ. (2569)', () => {
    const options = generateYearFilterOptions(2026, 3)
    expect(options).toEqual([
      { value: 'all', label: 'ทั้งหมด' },
      { value: '2026', label: '2569' },
      { value: '2025', label: '2568' },
      { value: '2024', label: '2567' },
    ])
  })

  it('span กำหนดจำนวนปีย้อนหลังได้', () => {
    const options = generateYearFilterOptions(2026, 1)
    expect(options).toHaveLength(2)
  })
})

describe('toStatusParam', () => {
  it('ค่าสถานะที่รู้จัก → คืนตรงตัว', () => {
    expect(toStatusParam('PENDING')).toBe('PENDING')
    expect(toStatusParam('APPROVED')).toBe('APPROVED')
    expect(toStatusParam('REJECTED')).toBe('REJECTED')
    expect(toStatusParam('CANCELLED')).toBe('CANCELLED')
  })

  it('"all" หรือค่าที่ไม่รู้จัก → undefined', () => {
    expect(toStatusParam('all')).toBeUndefined()
    expect(toStatusParam('bogus')).toBeUndefined()
  })
})

describe('toTypeParam', () => {
  it('ค่าประเภทลาที่รู้จัก → คืนตรงตัว', () => {
    expect(toTypeParam('vacation')).toBe('vacation')
    expect(toTypeParam('sick')).toBe('sick')
    expect(toTypeParam('personal')).toBe('personal')
  })

  it('"all" หรือค่าที่ไม่รู้จัก → undefined', () => {
    expect(toTypeParam('all')).toBeUndefined()
    expect(toTypeParam('bogus')).toBeUndefined()
  })
})
