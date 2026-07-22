import { describe, expect, it } from 'vitest'
import { buildLeaveFormSchema } from './leaveFormSchema'

describe('buildLeaveFormSchema (cross-field validation, P16 §3.6 ด่านเข้ม)', () => {
  const baseValues = {
    type: 'vacation' as const,
    reason: 'เหตุผล',
    attachments: [] as File[],
    proxyId: 'teammate-1',
  }

  it('endDate < startDate → ปฏิเสธด้วยข้อความที่ path dateRange', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      dateRange: { start: '2026-06-20', end: '2026-06-19' },
      days: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['dateRange'])
      expect(result.error.issues[0].message).toBe('วันสิ้นสุดต้องไม่ก่อนวันที่เริ่ม')
    }
  })

  it('ช่วง > 31 วัน → ปฏิเสธ', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      dateRange: { start: '2026-06-01', end: '2026-07-03' }, // 33 วันปฏิทิน
      days: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ช่วงวันลาต้องไม่เกิน 31 วัน')
    }
  })

  it('ช่วง = 31 วันพอดี ผ่านเกณฑ์ span (แต่ต้องมี days ครบด้วยถึงจะผ่านทั้งหมด)', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      dateRange: { start: '2026-06-01', end: '2026-07-01' },
      days: [], // จงใจไม่ครบ — ต้อง fail ที่ coverage ไม่ใช่ span
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).not.toBe('ช่วงวันลาต้องไม่เกิน 31 วัน')
    }
  })

  it('days ไม่ครบทุกวันทำงานในช่วง → ปฏิเสธ', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      dateRange: { start: '2026-06-01', end: '2026-06-03' }, // จ-พ = 3 วันทำงาน
      days: [{ date: '2026-06-01', period: 'full' }], // ขาด 06-02, 06-03
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณาเลือกช่วงเวลาให้ครบทุกวันทำงาน')
    }
  })

  it('days ครบทุกวันทำงาน + type/reason/proxyId ครบ → ผ่าน', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      dateRange: { start: '2026-06-01', end: '2026-06-03' },
      days: [
        { date: '2026-06-01', period: 'full' },
        { date: '2026-06-02', period: 'am' },
        { date: '2026-06-03', period: 'full' },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('proxyId ว่าง (ไม่เลือกผู้ปฏิบัติงานแทน) → ยังผ่าน (optional ตรง substituteId? ใน §16.3)', () => {
    const schema = buildLeaveFormSchema([])
    const result = schema.safeParse({
      ...baseValues,
      proxyId: '',
      dateRange: { start: '2026-06-01', end: '2026-06-03' },
      days: [
        { date: '2026-06-01', period: 'full' },
        { date: '2026-06-02', period: 'am' },
        { date: '2026-06-03', period: 'full' },
      ],
    })

    expect(result.success).toBe(true)
  })
})
