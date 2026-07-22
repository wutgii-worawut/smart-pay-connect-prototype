/**
 * features/leave/api/getBalance.ts — GET /leave/balance?year= (§16.3, P14)
 * schema ไม่ strict — ตัด field แปลกที่ backend เผลอส่งมาทิ้งอัตโนมัติ ไม่ throw (เหมือน P13 getHistory)
 * ดู CONTRACT FLAG ที่ types/leave.ts — response shape ยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveBalance } from '@/types/leave'

const leaveBalanceSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal']),
  total: z.number(),
  carriedOver: z.number(),
  used: z.number(),
  pending: z.number(),
  remaining: z.number(),
})

/** @param year ปี ค.ศ. */
export async function getBalance(year: number): Promise<LeaveBalance[]> {
  const data = await api.get<unknown>('/leave/balance', { params: { year } })
  return z.array(leaveBalanceSchema).parse(data)
}
