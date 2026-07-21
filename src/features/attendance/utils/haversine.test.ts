import { describe, expect, it } from 'vitest'
import { haversineMeters, isWithinRadius } from './haversine'

describe('haversineMeters', () => {
  it('คืนค่า 0 เมื่อเป็นจุดเดียวกัน', () => {
    const point = { lat: 13.7563, lng: 100.5018 }
    expect(haversineMeters(point, point)).toBe(0)
  })

  it('คำนวณระยะทาง 1 องศาลองจิจูดที่เส้นศูนย์สูตรได้ใกล้เคียงค่าที่รู้ (~111,195 ม. จากเส้นรอบวงโลก/360)', () => {
    // เส้นรอบวงโลก (สูตรทรงกลม รัศมี 6,371,000 ม.) หาร 360 = ระยะทาง 1 องศาที่เส้นศูนย์สูตร
    // ค่านี้คำนวณอิสระจาก implementation (เรขาคณิตวงกลม ไม่ใช่สูตร haversine) ใช้ยืนยันความถูกต้อง
    const distance = haversineMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })
    expect(distance).toBeGreaterThan(111190)
    expect(distance).toBeLessThan(111200)
  })

  it('ระยะทางสมมาตร (a→b เท่ากับ b→a)', () => {
    const a = { lat: 13.7563, lng: 100.5018 }
    const b = { lat: 13.7663, lng: 100.5118 }
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6)
  })
})

describe('isWithinRadius', () => {
  const office = { lat: 13.7563, lng: 100.5018 }

  it('true เมื่อผู้ใช้อยู่จุดเดียวกับออฟฟิศ (ระยะ 0 ≤ รัศมีใด ๆ)', () => {
    expect(isWithinRadius(office, office, 200)).toBe(true)
  })

  it('true เมื่อระยะทางน้อยกว่ารัศมีที่กำหนด', () => {
    // ~11 ม. ทางเหนือของออฟฟิศ (0.0001 องศาละติจูด ≈ 11.1 ม.)
    const nearbyUser = { lat: office.lat + 0.0001, lng: office.lng }
    expect(haversineMeters(nearbyUser, office)).toBeLessThan(200)
    expect(isWithinRadius(nearbyUser, office, 200)).toBe(true)
  })

  it('false เมื่อระยะทางมากกว่ารัศมีที่กำหนด', () => {
    // ~1,113 ม. ทางเหนือของออฟฟิศ (0.01 องศาละติจูด ≈ 1,113 ม.) — เกินรัศมี 200 ม.
    const farUser = { lat: office.lat + 0.01, lng: office.lng }
    expect(haversineMeters(farUser, office)).toBeGreaterThan(200)
    expect(isWithinRadius(farUser, office, 200)).toBe(false)
  })

  it('true พอดีขอบรัศมี (ระยะทาง = รัศมี)', () => {
    const distance = haversineMeters({ lat: 13.7563, lng: 100.5018 }, { lat: 13.7663, lng: 100.5118 })
    expect(isWithinRadius({ lat: 13.7563, lng: 100.5018 }, { lat: 13.7663, lng: 100.5118 }, distance)).toBe(true)
  })
})
