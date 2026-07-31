import { describe, expect, it } from 'vitest'
import { firstErrorField } from './firstErrorField'

describe('firstErrorField', () => {
  it('ไม่มี error เลย → คืน undefined', () => {
    expect(firstErrorField({})).toBeUndefined()
  })

  it('มี error field เดียว → คืน field นั้น', () => {
    expect(firstErrorField({ reason: { message: 'กรุณาระบุเหตุผลการลา' } })).toBe('reason')
  })

  it('error หลายตัว → คืนตัวบนสุดตามลำดับที่ปรากฏบนจอ (type ก่อน dateRange ก่อน reason)', () => {
    expect(
      firstErrorField({
        reason: { message: 'กรุณาระบุเหตุผลการลา' },
        dateRange: { message: 'กรุณาเลือกช่วงวันที่ลา' },
        type: { message: 'กรุณาเลือกประเภทการลา' },
      }),
    ).toBe('type')
  })

  it('error dateRange + reason (ไม่มี type) → คืน dateRange ก่อน', () => {
    expect(
      firstErrorField({
        reason: { message: 'กรุณาระบุเหตุผลการลา' },
        dateRange: { message: 'กรุณาเลือกช่วงวันที่ลา' },
      }),
    ).toBe('dateRange')
  })
})
