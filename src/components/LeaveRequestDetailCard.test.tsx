import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeaveRequestDetailCard } from './LeaveRequestDetailCard'
import type { LeaveRequestDetail } from '@/types/leave'

const PENDING_DETAIL: LeaveRequestDetail = {
  id: 'leave-pending-1',
  type: 'vacation',
  status: 'PENDING',
  requestNumber: 'ล 0706/10',
  startDate: '2026-06-19',
  endDate: '2026-06-19',
  days: [{ date: '2026-06-19', period: 'full' }],
  totalDays: 1,
  periodSummary: 'เต็มวัน',
  reason: 'เดินทางต่างจังหวัดกับครอบครัว',
  submittedAt: '2026-06-15',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: null,
  attachments: [{ id: 'att-1', name: 'ใบจองที่พัก.pdf', sizeLabel: '120 KB' }],
}

const APPROVED_DETAIL: LeaveRequestDetail = {
  ...PENDING_DETAIL,
  id: 'leave-history-1',
  status: 'APPROVED',
  requestNumber: 'ล 0605/10',
  startDate: '2026-05-12',
  endDate: '2026-05-14',
  days: [
    { date: '2026-05-12', period: 'full' },
    { date: '2026-05-13', period: 'am' },
    { date: '2026-05-14', period: 'pm' },
  ],
  totalDays: 2,
  submittedAt: '2026-05-10',
  approvedAt: '2026-05-14',
}

describe('LeaveRequestDetailCard', () => {
  it('PENDING → ปุ่ม "ยกเลิกคำขอ" (enabled) + "แก้ไขคำขอ" (disabled) และไม่มีปุ่ม "ปิด"', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<LeaveRequestDetailCard detail={PENDING_DETAIL} mode="owner-view" onCancel={onCancel} />)

    const cancelBtn = screen.getByRole('button', { name: 'ยกเลิกคำขอ' })
    expect(cancelBtn).toBeEnabled()
    await user.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)

    const editBtn = screen.getByRole('button', { name: 'แก้ไขคำขอ' })
    expect(editBtn).toBeDisabled()

    expect(screen.queryByRole('button', { name: 'ปิด' })).not.toBeInTheDocument()
  })

  it('APPROVED (read-only) → มีแค่ปุ่ม "ปิด" ไม่มี ยกเลิกคำขอ/แก้ไขคำขอ', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<LeaveRequestDetailCard detail={APPROVED_DETAIL} mode="owner-view" onClose={onClose} />)

    const closeBtn = screen.getByRole('button', { name: 'ปิด' })
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    expect(screen.queryByRole('button', { name: 'ยกเลิกคำขอ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'แก้ไขคำขอ' })).not.toBeInTheDocument()
  })

  it('แสดงฟิลด์หลัก: เลขที่ใบลา, เหตุผล, วันที่อนุมัติเป็น "—" เมื่อ null', () => {
    render(<LeaveRequestDetailCard detail={PENDING_DETAIL} mode="owner-view" />)

    expect(screen.getByText('ล 0706/10')).toBeInTheDocument()
    expect(screen.getByText('เดินทางต่างจังหวัดกับครอบครัว')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('วันเดียวเต็มวัน (PENDING) → ไม่แสดงแถว "รายละเอียดรายวัน"', () => {
    render(<LeaveRequestDetailCard detail={PENDING_DETAIL} mode="owner-view" />)
    expect(screen.queryByText('รายละเอียดรายวัน')).not.toBeInTheDocument()
  })

  it('หลายวันผสมครึ่งวัน (APPROVED) → แสดง "รายละเอียดรายวัน" พร้อมคำต่อท้าย เช้า/บ่าย', () => {
    render(<LeaveRequestDetailCard detail={APPROVED_DETAIL} mode="owner-view" />)

    expect(screen.getByText('รายละเอียดรายวัน')).toBeInTheDocument()
    // "12 พ.ค. 2569" ปรากฏซ้ำกับ "วันที่เริ่ม" (วันแรกตรงกัน) — เช็คจำนวนที่คาดไว้แทน exact single match
    expect(screen.getAllByText('12 พ.ค. 2569')).toHaveLength(2)
    expect(screen.getByText('13 พ.ค. 2569 เช้า')).toBeInTheDocument()
    expect(screen.getByText('14 พ.ค. 2569 บ่าย')).toBeInTheDocument()
  })
})
