/**
 * features/approval/api/getPending.ts — GET /approval/pending (§16.3, P19)
 * คืนใบลารออนุมัติของลูกทีมทั้งหมด (manager เห็นเฉพาะทีมตัวเอง — backend กรองด้วย `manager_id`,
 * §17.3) — reuse type `LeaveRequest` (D2 plan.md §1, มี `employeeName` สำหรับฝั่งนี้โดยเฉพาะ)
 *
 * 🔴 CONTRACT FLAG (P19): §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน (เหมือนสถานการณ์เดียวกับ
 * P14 `GET /leave/requests`) — schema/Zod ด้านล่างยึด shape เดียวกับ `LeaveRequest` (มี `employeeName`
 * เสมอในทางปฏิบัติของ endpoint นี้ แต่ยังประกาศ optional ไว้ตรงกับ type กลาง ไม่ narrow เกิน contract)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveRequest } from '@/types/leave'

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

export async function getPending(): Promise<LeaveRequest[]> {
  const data = await api.get<unknown>('/approval/pending')
  return z.array(leaveRequestSchema).parse(data)
}
