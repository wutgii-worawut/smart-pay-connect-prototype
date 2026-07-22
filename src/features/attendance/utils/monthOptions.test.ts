import { describe, expect, it } from 'vitest'
import { generateMonthOptions } from './monthOptions'

describe('generateMonthOptions', () => {
  it('เดือนแรกตรงกับ referenceDate และ label ไม่มีคำว่า "พ.ศ."', () => {
    const options = generateMonthOptions(new Date(2026, 6, 21)) // 21 ก.ค. 2026

    expect(options[0]).toEqual({ value: '2026-07', label: 'กรกฎาคม 2569' })
    expect(options[0].label).not.toContain('พ.ศ.')
  })

  it('ไล่ย้อนหลังทีละเดือน ครบตามจำนวนที่ขอ', () => {
    const options = generateMonthOptions(new Date(2026, 0, 15), 3) // ม.ค. 2026

    expect(options.map((o) => o.value)).toEqual(['2026-01', '2025-12', '2025-11'])
  })

  it('ข้ามปี (ม.ค.) ปีพ.ศ. ของเดือนก่อนหน้าลดลง 1 ปี', () => {
    const options = generateMonthOptions(new Date(2026, 0, 1), 2)

    expect(options[0].label).toBe('มกราคม 2569')
    expect(options[1].label).toBe('ธันวาคม 2568')
  })

  it('default count = 12', () => {
    const options = generateMonthOptions(new Date(2026, 6, 1))

    expect(options).toHaveLength(12)
  })
})
