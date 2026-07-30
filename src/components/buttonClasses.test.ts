import { describe, expect, it } from 'vitest'
import {
  FOCUS_VISIBLE_RING_CLASS,
  dangerSoftButtonClass,
  ghostButtonClass,
  primaryButtonClass,
} from './buttonClasses'

// เทสต์ regression ตรงที่ pure function เหล่านี้ผลิต class string ให้ปุ่มทั้งแอป (S11-S13) —
// ถ้าใครแก้ FOCUS_VISIBLE_RING_CLASS/BASE แล้ว ring หรือ sizing หลักหายไป เทสต์นี้ต้อง fail ก่อน
// component test ที่เช็คแค่ rounded-card/rounded-full (PrimaryButton.test.tsx ฯลฯ)
describe('buttonClasses', () => {
  const helpers = [
    { name: 'primaryButtonClass', fn: primaryButtonClass },
    { name: 'dangerSoftButtonClass', fn: dangerSoftButtonClass },
    { name: 'ghostButtonClass', fn: ghostButtonClass },
  ] as const

  it.each(helpers)('$name มี focus-visible ring class', ({ fn }) => {
    expect(fn()).toContain(FOCUS_VISIBLE_RING_CLASS)
  })

  it.each(helpers)('$name คง sizing หลัก w-full/py-4', ({ fn }) => {
    const result = fn()
    expect(result).toContain('w-full')
    expect(result).toContain('py-4')
  })

  it.each(helpers)('$name ยังได้ ring ทั้ง shape card และ pill', ({ fn }) => {
    expect(fn('card')).toContain(FOCUS_VISIBLE_RING_CLASS)
    expect(fn('pill')).toContain(FOCUS_VISIBLE_RING_CLASS)
  })
})
