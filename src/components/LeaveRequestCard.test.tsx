import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeaveRequestCard } from './LeaveRequestCard'
import type { LeaveRequest } from '@/types/leave'

const BASE_REQUEST: LeaveRequest = {
  id: 'req-1',
  type: 'vacation',
  status: 'PENDING',
  startDate: '2026-06-08',
  endDate: '2026-06-08',
  totalDays: 1,
  periodSummary: 'เต็มวัน',
}

describe('LeaveRequestCard', () => {
  it('แสดงชื่อประเภทลา + StatusBadge + meta line วันเดียว', () => {
    render(<LeaveRequestCard request={BASE_REQUEST} />)

    expect(screen.getByText('ลาพักร้อน')).toBeInTheDocument()
    expect(screen.getByText('รออนุมัติ')).toBeInTheDocument()
    expect(screen.getByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
  })

  it('ช่วงหลายวัน แสดง date label แบบช่วง', () => {
    const request: LeaveRequest = {
      ...BASE_REQUEST,
      id: 'req-2',
      startDate: '2026-06-16',
      endDate: '2026-06-17',
      totalDays: 2,
    }
    render(<LeaveRequestCard request={request} />)

    expect(screen.getByText('16–17 มิ.ย. 2569 · 2 วัน · เต็มวัน')).toBeInTheDocument()
  })

  it('showEmployeeName=true → บรรทัดแรกเป็นชื่อพนักงานแทนชื่อประเภทลา', () => {
    const request: LeaveRequest = { ...BASE_REQUEST, employeeName: 'สมชาย ใจดี' }
    render(<LeaveRequestCard request={request} showEmployeeName />)

    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    expect(screen.queryByText('ลาพักร้อน')).not.toBeInTheDocument()
  })

  it('showEmployeeName=true แต่ไม่มี employeeName → fallback เป็นชื่อประเภทลา', () => {
    render(<LeaveRequestCard request={BASE_REQUEST} showEmployeeName />)
    expect(screen.getByText('ลาพักร้อน')).toBeInTheDocument()
  })

  it('มี onClick → การ์ดกดได้และเรียก callback', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<LeaveRequestCard request={BASE_REQUEST} onClick={onClick} />)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
