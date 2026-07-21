import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('PENDING แสดง "รออนุมัติ" สี warning', () => {
    render(<StatusBadge status="PENDING" />)

    const badge = screen.getByText('รออนุมัติ')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-warning')
  })

  it('APPROVED แสดง "อนุมัติแล้ว" สี success', () => {
    render(<StatusBadge status="APPROVED" />)

    const badge = screen.getByText('อนุมัติแล้ว')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-success')
  })

  it('REJECTED แสดง "ไม่อนุมัติ" สี danger', () => {
    render(<StatusBadge status="REJECTED" />)

    const badge = screen.getByText('ไม่อนุมัติ')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-danger')
  })

  it('CANCELLED แสดง "ยกเลิก" สีเทา', () => {
    render(<StatusBadge status="CANCELLED" />)

    const badge = screen.getByText('ยกเลิก')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-text-secondary')
  })
})
