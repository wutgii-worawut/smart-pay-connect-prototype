import { describe, expect, it } from 'vitest'
import { getInitials } from './initials'

describe('getInitials', () => {
  it('2 คำ → อักษรตัวแรกของคำแรก + อักษรตัวแรกของคำที่สอง', () => {
    expect(getInitials('วิชัย มั่นคง')).toBe('วม')
  })

  it('1 คำ → 2 ตัวอักษรแรกของคำนั้น', () => {
    expect(getInitials('สมชาย')).toBe('สม')
  })

  it('ว่าง/ช่องว่างล้วน → คืนสตริงว่าง', () => {
    expect(getInitials('')).toBe('')
    expect(getInitials('   ')).toBe('')
  })
})
