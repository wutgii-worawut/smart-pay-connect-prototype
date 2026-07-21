/**
 * features/auth/api/requestOtp.ts — POST /auth/register/request-otp (§3.4, §13.2, §16.3)
 *
 * ⚠️ endpoint จริงยังตอบ 404 ตอน probe mock service (plan/progress.md บันทึกแก้แผน P8 ข้อ 3) —
 * ต้องพึ่ง MSW ล้วนจนกว่า backend/swagger พร้อม path จริง
 *
 * response shape (`refCode` + `email`) เป็นการออกแบบฝั่งเรา (contract จริงยังไม่ยืนยัน) — `email`
 * คือค่าที่ผู้ใช้กรอกสะท้อนกลับมา (ไม่ใช่ masked) ให้ P10 (OtpPage) โชว์เป็น chip read-only ได้ตรง ๆ
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'

const requestOtpResponseSchema = z.object({
  refCode: z.string(),
  email: z.email(),
})

export type RequestOtpResult = z.infer<typeof requestOtpResponseSchema>

export interface RequestOtpPayload {
  /** เลขบัตรประชาชน digits ล้วน 13 หลัก (ไม่มีขีด) — caller ต้อง extractCitizenIdDigits ก่อนส่ง */
  citizenId: string
  email: string
}

export async function requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResult> {
  const data = await api.post<unknown>('/auth/register/request-otp', payload)
  return requestOtpResponseSchema.parse(data)
}
