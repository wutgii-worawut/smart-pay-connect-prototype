/**
 * MSW handler skeleton — feature: approval (§16.3, §17.5) — เฉพาะ role: manager
 * โครงเริ่มต้นเท่านั้น — ทำเต็ม (pending, approve/reject, history) ใน P19-P20
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const approvalHandlers = [
  http.get(`${BASE_URL}/approval/pending`, () => {
    return HttpResponse.json({ data: [] })
  }),
]
