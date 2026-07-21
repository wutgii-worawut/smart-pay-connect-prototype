/**
 * MSW handler skeleton — feature: leave (§16.3)
 * โครงเริ่มต้นเท่านั้น — ทำเต็ม (balance, requests, cancel, error cases) ใน P14-P16
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const leaveHandlers = [
  http.get(`${BASE_URL}/leave/balance`, () => {
    return HttpResponse.json({
      data: [
        { leaveType: 'sick', label: 'ลาป่วย', remaining: 30, total: 30 },
        { leaveType: 'personal', label: 'ลากิจ', remaining: 6, total: 6 },
        { leaveType: 'vacation', label: 'ลาพักร้อน', remaining: 10, total: 10 },
      ],
    })
  }),
]
