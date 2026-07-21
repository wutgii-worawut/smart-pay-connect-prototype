/**
 * MSW handler skeleton — feature: calendar (§16.3)
 * รวม `/holidays` (ใช้ร่วมกับ leave ผ่าน `useHolidays` — D1 plan.md §1) และ `/leave/calendar`
 * โครงเริ่มต้นเท่านั้น — ทำเต็มใน P17-P18
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const calendarHandlers = [
  http.get(`${BASE_URL}/holidays`, () => {
    return HttpResponse.json({ data: [] })
  }),
]
