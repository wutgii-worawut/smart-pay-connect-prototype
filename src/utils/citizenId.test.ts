import { describe, expect, it } from 'vitest'
import { extractCitizenIdDigits, formatCitizenId } from './citizenId'

describe('extractCitizenIdDigits', () => {
  it('ตัดอักขระที่ไม่ใช่ตัวเลขออก', () => {
    expect(extractCitizenIdDigits('1-2345-67890-12-3')).toBe('1234567890123')
  })

  it('จำกัดไม่เกิน 13 หลัก แม้กรอกเกิน', () => {
    expect(extractCitizenIdDigits('123456789012345')).toBe('1234567890123')
  })

  it('ค่าว่าง → ค่าว่าง', () => {
    expect(extractCitizenIdDigits('')).toBe('')
  })
})

describe('formatCitizenId', () => {
  it('ค่าว่าง → ค่าว่าง', () => {
    expect(formatCitizenId('')).toBe('')
  })

  it('กรอกไม่ครบกลุ่มแรก (1 หลัก) → ไม่มีขีด', () => {
    expect(formatCitizenId('1')).toBe('1')
  })

  it('กรอกครบกลุ่มแรกพอดี ยังไม่เริ่มกลุ่มสอง', () => {
    expect(formatCitizenId('1')).toBe('1')
  })

  it('กรอกเข้ากลุ่มที่สองบางส่วน', () => {
    expect(formatCitizenId('12345')).toBe('1-2345')
  })

  it('กรอกครบ 13 หลัก → จัดกลุ่มเต็ม 1-4-5-2-1', () => {
    expect(formatCitizenId('1234567890123')).toBe('1-2345-67890-12-3')
  })

  it('รับ input ที่มีขีดปนมาแล้ว (พิมพ์ทับค่าที่ format แล้ว) ไม่ให้ขีดซ้อน', () => {
    expect(formatCitizenId('1-2345-67890-12-3')).toBe('1-2345-67890-12-3')
  })

  it('เกิน 13 หลัก → ตัดทิ้งส่วนเกิน', () => {
    expect(formatCitizenId('12345678901239999')).toBe('1-2345-67890-12-3')
  })
})
