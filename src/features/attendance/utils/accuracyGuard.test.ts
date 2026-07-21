import { describe, expect, it } from 'vitest'
import { isAccuracyDegraded } from './accuracyGuard'

describe('isAccuracyDegraded', () => {
  it('accuracy ดีกว่ารัศมี geofence → ไม่แย่', () => {
    expect(isAccuracyDegraded(15, 200)).toBe(false)
  })

  it('accuracy เท่ากับเกณฑ์พอดี → ยังไม่ถือว่าแย่ (ใช้ > ไม่ใช่ >=)', () => {
    expect(isAccuracyDegraded(200, 200)).toBe(false)
  })

  it('accuracy แย่กว่ารัศมี geofence (สาขารัศมีกว้าง) → แย่', () => {
    expect(isAccuracyDegraded(250, 200)).toBe(true)
  })

  it('สาขารัศมีแคบกว่า 100 ม. — ใช้พื้น 100 ม. เป็นเกณฑ์ ไม่ใช่รัศมีสาขาตรง ๆ', () => {
    expect(isAccuracyDegraded(80, 30)).toBe(false)
    expect(isAccuracyDegraded(120, 30)).toBe(true)
  })

  it('สาขารัศมีกว้างกว่า 100 ม. — ใช้รัศมีสาขาเป็นเกณฑ์ (มากกว่า 100 ม. พื้น)', () => {
    expect(isAccuracyDegraded(150, 200)).toBe(false)
    expect(isAccuracyDegraded(220, 200)).toBe(true)
  })
})
