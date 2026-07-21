/**
 * features/attendance/api/getToday.ts — GET /attendance/today (§16.3)
 * schema ตัด field ที่ไม่ประกาศทิ้งอัตโนมัติ (Zod ไม่ strict) — เพิ่ม field backend ทีหลังไม่พัง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { AttendanceToday } from '../types/attendance'

const officeSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radiusMeters: z.number(),
  name: z.string(),
  address: z.string().optional(),
})

const attendanceTodaySchema = z.object({
  clockedIn: z.boolean(),
  clockedOut: z.boolean(),
  clockInTime: z.string().nullable(),
  clockOutTime: z.string().nullable(),
  clockInType: z.enum(['onsite', 'remote']).nullable(),
  office: officeSchema,
  canRemoteClock: z.boolean(),
  date: z.string(),
})

export async function getToday(): Promise<AttendanceToday> {
  const data = await api.get<unknown>('/attendance/today')
  return attendanceTodaySchema.parse(data)
}
