import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Holiday } from '@/types/holiday'
import { HolidayListItem } from './HolidayListItem'

describe('HolidayListItem', () => {
  it('ประเภท government → กล่องวันที่/tag ใช้สี text-holiday-government', () => {
    const holiday: Holiday = { date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'government' }
    render(<HolidayListItem holiday={holiday} onClick={vi.fn()} />)

    expect(screen.getByText('วันขึ้นปีใหม่')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('ม.ค.')).toBeInTheDocument()
    expect(screen.getByText('พฤหัสบดี')).toBeInTheDocument()

    const tag = screen.getByText('วันหยุดราชการ')
    expect(tag).toHaveClass('text-holiday-government')

    const dayNumber = screen.getByText('1')
    expect(dayNumber).toHaveClass('text-holiday-government')
  })

  it('ประเภท religious → tag ใช้สี text-holiday-religious', () => {
    const holiday: Holiday = { date: '2026-03-03', name: 'วันมาฆบูชา', type: 'religious' }
    render(<HolidayListItem holiday={holiday} onClick={vi.fn()} />)

    expect(screen.getByText('วันสำคัญศาสนา')).toHaveClass('text-holiday-religious')
  })

  it('ประเภท royal → tag ใช้สี text-holiday-royal', () => {
    const holiday: Holiday = { date: '2026-04-06', name: 'วันจักรี', type: 'royal' }
    render(<HolidayListItem holiday={holiday} onClick={vi.fn()} />)

    expect(screen.getByText('วันสำคัญราชวงศ์')).toHaveClass('text-holiday-royal')
  })

  it('กดการ์ด → เรียก onClick', async () => {
    const onClick = vi.fn()
    const holiday: Holiday = { date: '2026-01-01', name: 'วันขึ้นปีใหม่', type: 'government' }
    render(<HolidayListItem holiday={holiday} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
