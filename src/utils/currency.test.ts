import { describe, expect, it } from 'vitest'
import { formatBaht, formatBahtAmount } from './currency'

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

describe('formatBahtAmount', () => {
  it('จำนวนเต็ม คั่นหลักพัน ไม่มีทศนิยม', () => {
    expect(formatBahtAmount(25000)).toBe('25,000')
  })

  it('จำนวนเต็มติดลบ', () => {
    expect(formatBahtAmount(-750)).toBe('-750')
  })

  it('ศูนย์บาท → ไม่มีทศนิยม (ต่างจาก PNG ที่โชว์ "0.00" — ดูคอมเมนต์ตัดสินใจใน currency.ts)', () => {
    expect(formatBahtAmount(0)).toBe('0')
  })

  it('มีเศษสตางค์ → โชว์ทศนิยม 2 ตำแหน่ง', () => {
    expect(formatBahtAmount(1500.5)).toBe('1,500.50')
  })

  it('มีเศษสตางค์ติดลบ', () => {
    expect(formatBahtAmount(-690.25)).toBe('-690.25')
  })
})
