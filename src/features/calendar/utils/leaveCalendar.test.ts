import { describe, expect, it } from 'vitest'
import { buildLeaveMap } from './leaveCalendar'

describe('buildLeaveMap', () => {
  it('array ว่าง → map ว่าง', () => {
    expect(buildLeaveMap([])).toEqual({})
  })

  it('หลายวัน → map ตรงตามวันที่/ประเภท', () => {
    const map = buildLeaveMap([
      { date: '2026-07-03', types: ['vacation'] },
      { date: '2026-07-08', types: ['sick'] },
      { date: '2026-07-10', types: ['vacation', 'personal'] },
    ])

    expect(map).toEqual({
      '2026-07-03': ['vacation'],
      '2026-07-08': ['sick'],
      '2026-07-10': ['vacation', 'personal'],
    })
  })

  it('วันที่ซ้ำกัน (backend ส่งซ้ำ) → รวม types แบบ dedupe ไม่ทิ้งข้อมูล', () => {
    const map = buildLeaveMap([
      { date: '2026-07-10', types: ['vacation'] },
      { date: '2026-07-10', types: ['vacation', 'sick'] },
    ])

    expect(map['2026-07-10']).toEqual(['vacation', 'sick'])
  })

  it('วันที่ไม่ซ้ำกันหลายวัน ไม่กระทบกัน (ไม่ mutate ข้าม key)', () => {
    const map = buildLeaveMap([
      { date: '2026-07-01', types: ['sick'] },
      { date: '2026-07-02', types: ['personal'] },
    ])

    expect(map['2026-07-01']).toEqual(['sick'])
    expect(map['2026-07-02']).toEqual(['personal'])
  })
})
