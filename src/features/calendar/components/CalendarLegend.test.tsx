import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarLegend } from './CalendarLegend'

describe('CalendarLegend', () => {
  it('แสดงครบ 3 ประเภทลา พร้อมจุดสี token ที่ถูกต้อง', () => {
    render(<CalendarLegend />)

    expect(screen.getByText('ลาพักร้อน')).toBeInTheDocument()
    expect(screen.getByText('ลาป่วย')).toBeInTheDocument()
    expect(screen.getByText('ลากิจ')).toBeInTheDocument()
  })

  it('จุดสีผูกกับ token --color-leave-* ที่ถูกต้องต่อประเภท', () => {
    const { container } = render(<CalendarLegend />)

    const dots = container.querySelectorAll('span[class*="bg-leave-"]')
    expect(dots).toHaveLength(3)
    expect(dots[0]).toHaveClass('bg-leave-vacation')
    expect(dots[1]).toHaveClass('bg-leave-sick')
    expect(dots[2]).toHaveClass('bg-leave-personal')
  })
})
