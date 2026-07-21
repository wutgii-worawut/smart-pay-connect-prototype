import { describe, expect, it } from 'vitest'
import { formatBaht } from './currency'

describe('formatBaht', () => {
  it('คั่นหลักพันและใส่ทศนิยม 2 ตำแหน่งเสมอ', () => {
    expect(formatBaht(28560)).toBe('28,560.00 บาท')
  })

  it('มีทศนิยมอยู่แล้ว ปัดเหลือ 2 ตำแหน่ง', () => {
    expect(formatBaht(1234567.891)).toBe('1,234,567.89 บาท')
  })

  it('ศูนย์บาท', () => {
    expect(formatBaht(0)).toBe('0.00 บาท')
  })

  it('จำนวนติดลบ (เช่น ยอดหักสุทธิ) ใส่เครื่องหมายลบ', () => {
    expect(formatBaht(-1500.5)).toBe('-1,500.50 บาท')
  })

  it('จำนวนน้อยกว่า 1000 ไม่มี comma', () => {
    expect(formatBaht(560)).toBe('560.00 บาท')
  })
})
