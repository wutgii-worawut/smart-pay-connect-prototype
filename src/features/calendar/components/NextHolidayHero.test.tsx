import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Holiday } from '@/types/holiday'
import { NextHolidayHero } from './NextHolidayHero'

const HOLIDAY: Holiday = {
  date: '2026-07-28',
  name: 'วันเฉลิมพระชนมพรรษาฯ',
  nameEn: "H.M. King's Birthday",
  type: 'royal',
}

describe('NextHolidayHero', () => {
  it('nextHoliday=null → ไม่ render อะไร (ซ่อน hero)', () => {
    const { container } = render(<NextHolidayHero nextHoliday={null} daysUntil={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('แสดงเลขวัน/เดือนย่อ/ชื่อไทย/subtitle วันในสัปดาห์+nameEn/tag ประเภท/นับถอยหลัง', () => {
    render(<NextHolidayHero nextHoliday={HOLIDAY} daysUntil={43} />)

    expect(screen.getByText('วันหยุดถัดไป · อีก 43 วัน')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('ก.ค.')).toBeInTheDocument()
    expect(screen.getByText('วันเฉลิมพระชนมพรรษาฯ')).toBeInTheDocument()
    expect(screen.getByText("วันอังคาร · H.M. King's Birthday")).toBeInTheDocument()
    expect(screen.getByText('วันสำคัญราชวงศ์')).toBeInTheDocument()
  })

  it('ไม่มี nameEn → subtitle แสดงแค่วันในสัปดาห์', () => {
    render(
      <NextHolidayHero
        nextHoliday={{ date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'government' }}
        daysUntil={5}
      />,
    )

    expect(screen.getByText('วันพฤหัสบดี')).toBeInTheDocument()
  })
})
