import { describe, expect, it } from 'vitest'
import { generatePayslipYearOptions } from './yearOptions'

describe('generatePayslipYearOptions', () => {
  it('คืน 3 ปีล่าสุด (ค่าเริ่มต้น) เรียงใหม่→เก่า พ.ศ. ถูกต้อง', () => {
    expect(generatePayslipYearOptions(2026)).toEqual([
      { value: '2026', label: '2569' },
      { value: '2025', label: '2568' },
      { value: '2024', label: '2567' },
    ])
  })

  it('กำหนดจำนวนปีเองได้', () => {
    expect(generatePayslipYearOptions(2026, 1)).toEqual([{ value: '2026', label: '2569' }])
  })
})
