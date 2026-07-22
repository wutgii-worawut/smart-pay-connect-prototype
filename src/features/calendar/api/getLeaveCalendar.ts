/**
 * features/calendar/api/getLeaveCalendar.ts — GET /leave/calendar?month= (§16.3 ไม่ระบุ shape จริง,
 * CONTRACT FLAG ที่ `types/leaveCalendar.ts`, P18) — "ชั้นปฏิทิน" ทั้งเดือน โหลดครั้งเดียวตอนเปิด/สลับเดือน
 * schema ไม่ strict — ตัด field แปลกที่ backend เผลอส่งมาทิ้งอัตโนมัติ ไม่ throw (เหมือน getRequest/getBalance)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveCalendarDay } from '../types/leaveCalendar'

const leaveCalendarDaySchema = z.object({
  date: z.iso.date(),
  types: z.array(z.enum(['vacation', 'sick', 'personal'])),
})

/** @param month 'YYYY-MM' */
export async function getLeaveCalendar(month: string): Promise<LeaveCalendarDay[]> {
  const data = await api.get<unknown>('/leave/calendar', { params: { month } })
  return z.array(leaveCalendarDaySchema).parse(data)
}
