/**
 * features/attendance/api/getHistory.ts — GET /attendance/history?month= (§16.3, P13)
 * schema ตัด field ที่ไม่ประกาศทิ้งอัตโนมัติ (Zod ไม่ strict) — เพิ่ม field backend ทีหลังไม่พัง
 * ดู CONTRACT FLAG ที่ types/attendance.ts — response shape ทั้งชุดยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { AttendanceHistoryDay } from '../types/attendance'

const historyEntrySchema = z.object({
  direction: z.enum(['clock-in', 'clock-out']),
  time: z.string(),
  status: z.enum(['normal', 'late']),
  clockType: z.enum(['onsite', 'remote']),
  location: z.string(),
})

const historyDaySchema = z.object({
  date: z.string(),
  entries: z.array(historyEntrySchema),
})

/** @param month 'YYYY-MM' */
export async function getHistory(month: string): Promise<AttendanceHistoryDay[]> {
  const data = await api.get<unknown>('/attendance/history', { params: { month } })
  return z.array(historyDaySchema).parse(data)
}
