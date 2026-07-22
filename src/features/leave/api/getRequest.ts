/**
 * features/leave/api/getRequest.ts — GET /leave/requests/{id} (§16.3, P15)
 * schema ไม่ strict — ตัด field แปลกที่ backend เผลอส่งมาทิ้งอัตโนมัติ ไม่ throw (เหมือน getBalance/getRequests)
 * ดู CONTRACT FLAG ที่ types/leave.ts (`LeaveRequestDetail`) — response shape ยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveRequestDetail } from '@/types/leave'

const leaveDayEntrySchema = z.object({
  date: z.iso.date(),
  period: z.enum(['full', 'am', 'pm']),
})

const leaveAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeLabel: z.string(),
  url: z.string().optional(),
})

const leaveRequestDetailSchema = z.object({
  id: z.string(),
  type: z.enum(['vacation', 'sick', 'personal']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  requestNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  days: z.array(leaveDayEntrySchema),
  totalDays: z.number(),
  periodSummary: z.string(),
  reason: z.string(),
  submittedAt: z.string(),
  proxyName: z.string(),
  approverName: z.string(),
  approvedAt: z.string().nullable(),
  attachments: z.array(leaveAttachmentSchema),
})

export async function getRequest(id: string): Promise<LeaveRequestDetail> {
  const data = await api.get<unknown>(`/leave/requests/${id}`)
  return leaveRequestDetailSchema.parse(data)
}
