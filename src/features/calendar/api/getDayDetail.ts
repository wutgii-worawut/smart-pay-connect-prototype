/**
 * features/calendar/api/getDayDetail.ts — GET /leave/calendar/{date} (§16.3 ไม่ระบุ shape จริง,
 * CONTRACT FLAG ที่ `types/leaveCalendar.ts`, P18) — "ชั้นรายละเอียด" โหลดตอนกดวันเท่านั้น
 * (TanStack Query cache ให้กดวันที่เคยกดเปิดซ้ำได้ทันที ผ่าน `useDayDetail`)
 *
 * เรื่องสิทธิ์/PDPA (§10.3): endpoint นี้เปิดเผยว่าใครลาประเภทไหน (ข้อมูลสุขภาพกรณีลาป่วย) — backend
 * เป็นคนกรองตาม role ว่าจะส่งอะไรให้ใคร ไฟล์นี้ frontend แค่ render สิ่งที่ API คืนมาตรง ๆ ไม่ตัดสินใจเอง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveDayDetailEntry } from '../types/leaveCalendar'

const leaveDayDetailEntrySchema = z.object({
  employeeName: z.string(),
  type: z.enum(['vacation', 'sick', 'personal']),
  period: z.string(),
})

/** @param date 'YYYY-MM-DD' */
export async function getDayDetail(date: string): Promise<LeaveDayDetailEntry[]> {
  const data = await api.get<unknown>(`/leave/calendar/${date}`)
  return z.array(leaveDayDetailEntrySchema).parse(data)
}
