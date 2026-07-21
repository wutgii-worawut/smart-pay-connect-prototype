/**
 * features/attendance/api/clockOut.ts — POST /attendance/clock-out (§15, §16.3 "โครงเดียวกับ clock-in")
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { ClockRequestPayload, ClockResponse } from '../types/attendance'

const clockResponseSchema = z.object({
  date: z.string(),
  time: z.string(),
  type: z.enum(['onsite', 'remote']),
})

export async function clockOut(payload: ClockRequestPayload): Promise<ClockResponse> {
  const data = await api.post<unknown>('/attendance/clock-out', payload)
  return clockResponseSchema.parse(data)
}
