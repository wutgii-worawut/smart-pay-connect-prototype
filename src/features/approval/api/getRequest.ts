/**
 * features/approval/api/getRequest.ts — GET /approval/requests/{id} (§16.3, P20, จอ
 * `2.Pending Details.png` / `5.History Details - Approved.png` / `6.History Details - Read
 * Only.png`) คืนรายละเอียดใบลาของลูกทีมให้หัวหน้าตัดสิน — reuse type `LeaveRequestDetail` (D2
 * plan.md §1) เดียวกับฝั่งเจ้าของใบลา (`features/leave/api/getRequest.ts`) แต่เพิ่ม field ที่มีเฉพาะ
 * ฝั่ง Approval (`employeeName`/`remainingBalance`/`approverComment`)
 *
 * 🔴 CONTRACT FLAG (P20): §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน (เหมือนสถานการณ์เดียวกับ
 * P15 `GET /leave/requests/{id}`) — schema/ข้อมูลตัวอย่างอิงจาก design `2.Pending Details.png`
 * (นายกุหลาบ ประพฤติดี, ลาพักร้อน, วันลาคงเหลือ 20/21 วัน) รอ probe swagger จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveRequestDetail } from '@/types/leave'

const leaveDayEntrySchema = z.object({
  date: z.string(),
  period: z.enum(['full', 'am', 'pm']),
})

const leaveAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeLabel: z.string(),
  url: z.string().optional(),
})

const approvalRequestDetailSchema = z.object({
  id: z.string(),
  type: z.enum(['vacation', 'sick', 'personal']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  requestNumber: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.array(leaveDayEntrySchema),
  totalDays: z.number(),
  periodSummary: z.string(),
  reason: z.string(),
  submittedAt: z.string(),
  proxyName: z.string(),
  approverName: z.string(),
  approvedAt: z.string().nullable(),
  attachments: z.array(leaveAttachmentSchema),
  employeeName: z.string().optional(),
  remainingBalance: z.number().optional(),
  approverComment: z.string().optional(),
})

export async function getApprovalRequest(id: string): Promise<LeaveRequestDetail> {
  const data = await api.get<unknown>(`/approval/requests/${id}`)
  return approvalRequestDetailSchema.parse(data)
}
