/**
 * features/attendance/api/clockIn.ts — POST /attendance/clock-in (§15, §16.3)
 * ส่ง `{lat,lng,accuracy,type,remoteReason?}` — server ประทับเวลา+ตรวจ geofence จริง (client haversine
 * เป็นแค่ preview UX) ห้ามส่ง timestamp จาก client เอง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { ClockRequestPayload, ClockResponse } from '../types/attendance'

const clockResponseSchema = z.object({
  date: z.string(),
  time: z.string(),
  type: z.enum(['onsite', 'remote']),
})

export async function clockIn(payload: ClockRequestPayload): Promise<ClockResponse> {
  const data = await api.post<unknown>('/attendance/clock-in', payload)
  return clockResponseSchema.parse(data)
}
