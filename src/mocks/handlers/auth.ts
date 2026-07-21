/**
 * MSW handler skeleton — feature: auth (§16.3)
 * โครงเริ่มต้นเท่านั้น — ยังไม่ครบ flow (NEED_REGISTER / OTP / ID_TOKEN_EXPIRED ฯลฯ) ทำเต็มใน P8-P10
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const authHandlers = [
  http.post(`${BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      data: {
        token: 'mock-jwt-token',
        employee: { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' },
      },
    })
  }),
]
