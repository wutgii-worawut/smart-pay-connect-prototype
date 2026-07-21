/**
 * MSW handler skeleton — feature: attendance (§16.3)
 * โครงเริ่มต้นเท่านั้น — ทำเต็ม (clock-in/out, history, error cases) ใน P11-P13
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const attendanceHandlers = [
  http.get(`${BASE_URL}/attendance/today`, () => {
    return HttpResponse.json({
      data: {
        clockedIn: false,
        clockedOut: false,
        office: { lat: 13.7563, lng: 100.5018, radiusMeters: 200 },
      },
    })
  }),
]
