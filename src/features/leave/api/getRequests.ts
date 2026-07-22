/**
 * features/leave/api/getRequests.ts — GET /leave/requests?status=&type=&year=&month= (§16.3, P14)
 * ใช้ทั้งมุมมอง "รออนุมัติลา" (`status:'PENDING'`) และ "ประวัติการลาของฉัน" (§3.3 — โครงเดียวกัน
 * เปลี่ยน query ไม่ใช่หน้าใหม่) — caller (page) เป็นคนตัดสิน params ที่จะส่ง (undefined = ไม่กรอง field นั้น)
 *
 * ดู CONTRACT FLAG ที่ types/leave.ts (`LeaveRequest`) — response shape ยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '@/types/leave'

export interface LeaveRequestsParams {
  status?: LeaveRequestStatus
  type?: LeaveType
  /** ปี ค.ศ. */
  year?: number
  /** เดือน 1-12 */
  month?: number
}

const leaveRequestSchema = z.object({
  id: z.string(),
  type: z.enum(['vacation', 'sick', 'personal']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  periodSummary: z.string(),
  employeeName: z.string().optional(),
})

export async function getRequests(params: LeaveRequestsParams): Promise<LeaveRequest[]> {
  const data = await api.get<unknown>('/leave/requests', { params })
  return z.array(leaveRequestSchema).parse(data)
}
