/**
 * features/approval/api/getHistory.ts — GET /approval/history?year=&month= (§16.3, P19, จอ `4.History.png`)
 * คืนใบลาของลูกทีมที่หัวหน้าตัดสินไปแล้ว (APPROVED/REJECTED) ของเดือน/ปีที่เลือก — reuse type
 * `LeaveRequest` เดียวกับ `getPending`
 *
 * 🔴 CONTRACT FLAG (P19): shape invented ทั้งหมดเช่นเดียวกับ `getPending` — รอ probe swagger จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveRequest } from '@/types/leave'

const leaveRequestSchema = z.object({
  id: z.string(),
  type: z.enum(['vacation', 'sick', 'personal']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  totalDays: z.number(),
  periodSummary: z.string(),
  employeeName: z.string().optional(),
})

export async function getHistory(year: number, month: number): Promise<LeaveRequest[]> {
  const data = await api.get<unknown>('/approval/history', { params: { year, month } })
  return z.array(leaveRequestSchema).parse(data)
}
