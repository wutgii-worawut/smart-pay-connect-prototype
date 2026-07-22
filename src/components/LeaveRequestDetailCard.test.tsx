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

  // --- P20: approver-action / approver-view (feature-plans/04 §4.2/§4.5/§4.6) ---

  const APPROVER_PENDING_DETAIL: LeaveRequestDetail = {
    ...PENDING_DETAIL,
    id: 'approval-pending-1',
    employeeName: 'นายกุหลาบ ประพฤติดี',
    remainingBalance: 20,
  }

  const APPROVER_APPROVED_DETAIL: LeaveRequestDetail = {
    ...APPROVED_DETAIL,
    id: 'approval-history-1',
    employeeName: 'นายกุหลาบ ประพฤติดี',
    remainingBalance: 21,
  }

  it('approver-action (PENDING ในมือหัวหน้า) → หัวการ์ดเป็นชื่อพนักงาน + ปุ่ม "ไม่อนุมัติ"/"อนุมัติ" + textarea ความเห็น (ไม่ใช่ปุ่มฝั่งเจ้าของ)', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onReject = vi.fn()
    const onCommentChange = vi.fn()
    render(
      <LeaveRequestDetailCard
        detail={APPROVER_PENDING_DETAIL}
        mode="approver-action"
        comment=""
        onCommentChange={onCommentChange}
        onApprove={onApprove}
        onReject={onReject}
      />,
    )

    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
    expect(screen.getByText('ส่งคำขอเมื่อ 15 มิ.ย. 2569')).toBeInTheDocument()
    expect(screen.getByText('20 วัน')).toBeInTheDocument()

    // gate ด้วย mode ไม่ใช่ status — ใบนี้ status ก็ PENDING เหมือนกัน แต่ต้องไม่มีปุ่มฝั่งเจ้าของ
    expect(screen.queryByRole('button', { name: 'ยกเลิกคำขอ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'แก้ไขคำขอ' })).not.toBeInTheDocument()

    const rejectBtn = screen.getByRole('button', { name: 'ไม่อนุมัติ' })
    const approveBtn = screen.getByRole('button', { name: 'อนุมัติ' })
    expect(rejectBtn).toBeEnabled()
    expect(approveBtn).toBeEnabled()

    await user.click(rejectBtn)
    expect(onReject).toHaveBeenCalledTimes(1)
    await user.click(approveBtn)
    expect(onApprove).toHaveBeenCalledTimes(1)

    const textarea = screen.getByLabelText('ความเห็นผู้อนุมัติ (ถ้ามี)')
    await user.type(textarea, 'x')
    expect(onCommentChange).toHaveBeenCalled()
  })

  it('approver-action isSubmitting → ปุ่ม "ไม่อนุมัติ"/"อนุมัติ" disabled', () => {
    // จับ ref ปุ่มตอนยังไม่ isPending ก่อน (spinner ใส่ aria-label เข้าไปในชื่อ accessible ของปุ่ม
    // ตอน isPending ทำให้ query ด้วยชื่อเดิมแบบ exact ไม่เจอ — มิเรอร์วิธี `LeaveDetailPage.test.tsx`
    // "ปุ่มยืนยันยกเลิก disabled ระหว่าง isPending" ที่จับปุ่มไว้ก่อนแล้วค่อย rerender)
    const { rerender } = render(
      <LeaveRequestDetailCard detail={APPROVER_PENDING_DETAIL} mode="approver-action" comment="" />,
    )
    const rejectBtn = screen.getByRole('button', { name: 'ไม่อนุมัติ' })
    const approveBtn = screen.getByRole('button', { name: 'อนุมัติ' })

    rerender(
      <LeaveRequestDetailCard
        detail={APPROVER_PENDING_DETAIL}
        mode="approver-action"
        comment=""
        isSubmitting
      />,
    )

    expect(rejectBtn).toBeDisabled()
    expect(approveBtn).toBeDisabled()
  })

  it('approver-view (APPROVED, canRevoke default false) → มีแค่ปุ่ม "ปิด" ไม่มี textarea input และไม่มีปุ่มยกเลิกคำขอ', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<LeaveRequestDetailCard detail={APPROVER_APPROVED_DETAIL} mode="approver-view" onClose={onClose} />)

    expect(screen.getByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
    expect(screen.queryByLabelText('ความเห็นผู้อนุมัติ (ถ้ามี)')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ยกเลิกคำขอ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ไม่อนุมัติ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'อนุมัติ' })).not.toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'ปิด' })
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('approver-view มี approverComment → แสดง DetailField อ่านอย่างเดียว "ความเห็นผู้อนุมัติ"', () => {
    render(
      <LeaveRequestDetailCard
        detail={{ ...APPROVER_APPROVED_DETAIL, approverComment: 'อนุมัติ แต่ฝากงานให้เรียบร้อยก่อน' }}
        mode="approver-view"
      />,
    )
    expect(screen.getByText('ความเห็นผู้อนุมัติ')).toBeInTheDocument()
    expect(screen.getByText('อนุมัติ แต่ฝากงานให้เรียบร้อยก่อน')).toBeInTheDocument()
  })
})
