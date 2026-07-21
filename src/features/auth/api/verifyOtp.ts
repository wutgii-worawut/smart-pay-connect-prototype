/**
 * features/auth/api/verifyOtp.ts — POST /auth/register/verify-otp (feature-plans/01 §1.3, §16.3)
 *
 * ⚠️ endpoint จริงยังตอบ 404 ตอน probe mock service เหมือน request-otp (plan/progress.md บันทึก
 * แก้แผน P8 ข้อ 3 / P9 ข้อ 2) — ต้องพึ่ง MSW ล้วนจนกว่า backend/swagger พร้อม path จริง
 *
 * response shape `{token, employee}` มาจาก §16.3 ตรง ๆ (สัญญาเดียวกับ `POST /auth/login` สำเร็จ —
 * ผูกบัญชีเสร็จแล้วออก JWT ทันทีเหมือนกัน) จึงใช้ schema เดียวกับ login.ts (คัดลอกมา ไม่ import
 * ข้ามไฟล์ เพราะ login.ts ไม่ export schema — ตามแบบเดิมที่ requestOtp.ts ประกาศ schema ของตัวเอง)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { Employee } from '../types/auth'

const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['employee', 'manager']),
})

const verifyOtpResponseSchema = z.object({
  token: z.string(),
  employee: employeeSchema,
})

export type VerifyOtpResult = z.infer<typeof verifyOtpResponseSchema>

export interface VerifyOtpPayload {
  /** ค่ารวม 6 ตัวจาก OTPInput — caller (OtpPage) ต้อง validate ผ่าน regex `/^[A-Z0-9]{6}$/` ก่อนส่ง
   * กัน space placeholder ภายใน (P6 บันทึกแก้แผน 2.1) หลุดเข้า payload */
  otp: string
  refCode: string
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  const data = await api.post<unknown>('/auth/register/verify-otp', payload)
  const parsed = verifyOtpResponseSchema.parse(data)
  return { token: parsed.token, employee: parsed.employee satisfies Employee }
}
