/**
 * MSW handler — feature: auth (§13, §16.2, §16.3) — POST /auth/login เท่านั้น (P8; OTP/register
 * เต็มใน P9-P10)
 *
 * scenario สลับได้ผ่าน `setAuthScenario()` (dev console หรือเทสต์) — default 'authenticated'
 * เพราะ mock service จริงที่ probe แล้ว (2026-07-21) ตอบ 200 authenticated เสมอไม่ว่า idToken
 * จะเป็นอะไร (รวม liff-mock default `'id_token'`) — ไม่เคยเจอ NEED_REGISTER จริงให้ยืนยัน shape
 * จึงทำ shape ฝั่งเราแบบ envelope-consistent (ดูรายละเอียด/คำเตือนเต็มใน features/auth/api/login.ts)
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type AuthScenario = 'authenticated' | 'need_register' | 'employee_inactive' | 'id_token_expired'

let scenario: AuthScenario = 'authenticated'

/** สลับ scenario ของ POST /auth/login (ใช้ในเทสต์ หรือจาก dev console ตอน `npm run dev`) */
export function setAuthScenario(next: AuthScenario): void {
  scenario = next
}

const MOCK_EMPLOYEE = { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' }

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

      case 'authenticated':
      default:
        return HttpResponse.json({
          data: { token: 'mock-jwt-token', employee: MOCK_EMPLOYEE },
        })
    }
  }),
]
