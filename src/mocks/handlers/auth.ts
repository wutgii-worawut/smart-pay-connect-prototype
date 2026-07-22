/**
 * MSW handler — feature: auth (§13, §16.2, §16.3) — POST /auth/login (P8) +
 * POST /auth/register/request-otp (P9) + POST /auth/register/verify-otp (P10)
 *
 * scenario สลับได้ผ่าน `setAuthScenario()` (dev console หรือเทสต์) — default 'authenticated'
 * เพราะ mock service จริงที่ probe แล้ว (2026-07-21) ตอบ 200 authenticated เสมอไม่ว่า idToken
 * จะเป็นอะไร (รวม liff-mock default `'id_token'`) — ไม่เคยเจอ NEED_REGISTER จริงให้ยืนยัน shape
 * จึงทำ shape ฝั่งเราแบบ envelope-consistent (ดูรายละเอียด/คำเตือนเต็มใน features/auth/api/login.ts)
 *
 * `/auth/register/request-otp` + `/auth/register/verify-otp` จริงตอบ 404 ตอน probe
 * (plan/progress.md บันทึกแก้แผน P8 ข้อ 3 / P9 ข้อ 2) — shape/error code ทั้งหมดด้านล่างเป็นการ
 * ออกแบบฝั่งเรา รอ backend/swagger ยืนยัน
 *
 * 🔴 P19 เพิ่ม scenario `'manager'` (additive — ไม่แตะ default 'authenticated' เดิม) ให้ทดสอบ/dev
 * หน้า Approval ได้: `setAuthScenario('manager')` แล้ว reload → login คืน `MANAGER_EMPLOYEE`
 * (`role: 'manager'`) แทน `MOCK_EMPLOYEE` ปกติ
 */
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { BASE_URL } from '../base'

export type AuthScenario =
  | 'authenticated'
  | 'need_register'
  | 'employee_inactive'
  | 'id_token_expired'
  | 'manager'

let scenario: AuthScenario = 'authenticated'

/** สลับ scenario ของ POST /auth/login (ใช้ในเทสต์ หรือจาก dev console ตอน `npm run dev`) */
export function setAuthScenario(next: AuthScenario): void {
  scenario = next
}

const MOCK_EMPLOYEE = { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' }

/** พนักงานบทบาทหัวหน้า (P19) — ชื่อตรง design `4.Leave Approval/1.Pending List.png` ("คุณวิชัย มั่นคง") */
const MANAGER_EMPLOYEE = { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' }

export type RegisterOtpScenario =
  | 'success'
  | 'validation_error'
  | 'employee_not_found'
  | 'rate_limited'

let registerOtpScenario: RegisterOtpScenario = 'success'

/** สลับ scenario ของ POST /auth/register/request-otp (เทสต์ หรือ dev console) */
export function setRegisterOtpScenario(next: RegisterOtpScenario): void {
  registerOtpScenario = next
}

const requestOtpBodySchema = z.object({ citizenId: z.string(), email: z.string() })

export type VerifyOtpScenario = 'success' | 'otp_invalid' | 'otp_expired' | 'otp_rate_limited'

let verifyOtpScenario: VerifyOtpScenario = 'success'

/** สลับ scenario ของ POST /auth/register/verify-otp (เทสต์ หรือ dev console) */
export function setVerifyOtpScenario(next: VerifyOtpScenario): void {
  verifyOtpScenario = next
}

export const authHandlers = [
  http.post(`${BASE_URL}/auth/login`, () => {
    switch (scenario) {
      case 'need_register':
        // envelope-consistent ตาม §16.1 (ไม่ใช่ bare {code:'NEED_REGISTER'} ตาม §13.4 pseudocode
        // — ดูคำอธิบายเต็มใน features/auth/api/login.ts)
        return HttpResponse.json({ data: { status: 'NEED_REGISTER' } })

      case 'employee_inactive':
        return HttpResponse.json(
          {
            error: {
              code: 'EMPLOYEE_INACTIVE',
              message: 'บัญชีพนักงานถูกระงับ กรุณาติดต่อฝ่ายบุคคล',
            },
          },
          { status: 403 },
        )

      case 'id_token_expired':
        return HttpResponse.json(
          { error: { code: 'ID_TOKEN_EXPIRED', message: 'โทเคนหมดอายุ กรุณาเข้าใหม่' } },
          { status: 401 },
        )

      case 'manager':
        return HttpResponse.json({
          data: { token: 'mock-jwt-token-manager', employee: MANAGER_EMPLOYEE },
        })

      case 'authenticated':
      default:
        return HttpResponse.json({
          data: { token: 'mock-jwt-token', employee: MOCK_EMPLOYEE },
        })
    }
  }),

  http.post(`${BASE_URL}/auth/register/request-otp`, async ({ request }) => {
    const parsedBody = requestOtpBodySchema.safeParse(await request.json())
    const email = parsedBody.success ? parsedBody.data.email : ''

    switch (registerOtpScenario) {
      case 'validation_error':
        return HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบเลขประจำตัวประชาชนหรืออีเมลอีกครั้ง',
            },
          },
          { status: 400 },
        )

      case 'employee_not_found':
        return HttpResponse.json(
          {
            error: {
              code: 'EMPLOYEE_NOT_FOUND',
              message: 'ไม่พบข้อมูลพนักงาน กรุณาติดต่อฝ่ายบุคคล (HR)',
            },
          },
          { status: 404 },
        )

      case 'rate_limited':
        return HttpResponse.json(
          {
            error: {
              code: 'OTP_RATE_LIMITED',
              message: 'ขอรหัส OTP บ่อยเกินไป กรุณารออีก 5 นาทีแล้วลองใหม่',
            },
          },
          { status: 429 },
        )

      case 'success':
      default:
        return HttpResponse.json({ data: { refCode: 'REF-1234', email } })
    }
  }),

  http.post(`${BASE_URL}/auth/register/verify-otp`, () => {
    switch (verifyOtpScenario) {
      case 'otp_invalid':
        return HttpResponse.json(
          { error: { code: 'OTP_INVALID', message: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' } },
          { status: 400 },
        )

      case 'otp_expired':
        return HttpResponse.json(
          {
            error: {
              code: 'OTP_EXPIRED',
              message: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่',
            },
          },
          { status: 400 },
        )

      case 'otp_rate_limited':
        return HttpResponse.json(
          {
            error: {
              code: 'OTP_RATE_LIMITED',
              message: 'ยืนยัน OTP ผิดบ่อยเกินไป กรุณารออีก 5 นาทีแล้วลองใหม่',
            },
          },
          { status: 429 },
        )

      case 'success':
      default:
        return HttpResponse.json({
          data: { token: 'mock-jwt-token-register', employee: MOCK_EMPLOYEE },
        })
    }
  }),
]
