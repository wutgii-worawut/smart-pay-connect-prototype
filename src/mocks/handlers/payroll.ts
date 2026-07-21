/**
 * MSW handler skeleton — feature: payroll (§16.3)
 * โครงเริ่มต้นเท่านั้น — ทำเต็ม (list, detail, email) ใน P21
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const payrollHandlers = [
  http.get(`${BASE_URL}/payroll/payslips`, () => {
    return HttpResponse.json({ data: [] })
  }),
]
