/**
 * features/leave/api/createLeave.ts — POST /leave/requests (§16.3, P16, feature-plans/03 §3.6)
 *
 * request body **มีระบุจริงใน architecture §16.3**: `{leaveType, days:[{date,period}], reason,
 * substituteId?}` — ชื่อ field ที่ส่งขึ้น backend (`leaveType`/`substituteId`) ยึดตาม §16.3 ตรง ๆ
 * (แก้จาก draft เดิมที่ใช้ `type`/`proxyId` ผิด — consultant review 2026-07-22) ส่ง JSON ธรรมดาเมื่อ
 * ไม่มีไฟล์แนบ, สลับเป็น `multipart/form-data` เมื่อมี `attachments` (`leaveType`/`reason`/
 * `substituteId` ยัด field เดี่ยว ๆ, `days` เป็น JSON string เพราะ FormData ไม่รองรับ nested
 * array/object ตรง ๆ — การ encode เป็น multipart เองเป็นการตัดสินใจฝั่งเรา ยังไม่ยืนยันกับ backend ว่า
 * multipart field ชื่อ/รูปแบบนี้ตรงหรือไม่ ต่างจาก JSON path ที่ตรง §16.3 เป๊ะ)
 * `substituteId` เป็น optional — omit key ทั้งอันเมื่อไม่มี (ดู `LeaveForm.tsx` ที่ประกอบ payload)
 *
 * 🔴 CONTRACT FLAG เหลือแค่ฝั่ง **response** เท่านั้นที่ยัง invented รอ swagger ยืนยัน (เหมือน
 * สถานการณ์ P14/P15) — mock service ไม่ persist ไบต์ไฟล์จริง แค่ echo field อื่นกลับพอสำหรับ
 * prototype (ดู `src/mocks/handlers/leave.ts`)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { LeaveCreatePayload, LeaveCreateResult } from '@/types/leave'

const leaveCreateResultSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  type: z.enum(['vacation', 'sick', 'personal']),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  periodSummary: z.string(),
})

function buildRequestBody(payload: LeaveCreatePayload): FormData | Record<string, unknown> {
  if (payload.attachments.length === 0) {
    return {
      leaveType: payload.leaveType,
      days: payload.days,
      reason: payload.reason,
      ...(payload.substituteId ? { substituteId: payload.substituteId } : {}),
    }
  }

  const form = new FormData()
  form.append('leaveType', payload.leaveType)
  form.append('days', JSON.stringify(payload.days))
  form.append('reason', payload.reason)
  if (payload.substituteId) form.append('substituteId', payload.substituteId)
  payload.attachments.forEach((file) => form.append('attachments', file))
  return form
}

export async function createLeave(payload: LeaveCreatePayload): Promise<LeaveCreateResult> {
  const data = await api.post<unknown>('/leave/requests', buildRequestBody(payload))
  return leaveCreateResultSchema.parse(data)
}
