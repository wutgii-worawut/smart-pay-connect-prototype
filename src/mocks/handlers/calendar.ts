/**
 * MSW handler — feature: calendar (§16.3) — `GET /holidays?year=` (P17 enrich → `Holiday[]`, ใช้ร่วม
 * กับ leave ผ่าน `useHolidays` — D1 plan.md §1) + `/leave/calendar` (โครงเริ่มต้นเท่านั้น ทำเต็ม P18)
 *
 * P17: seed วันหยุดราชการไทยจริงของปี พ.ศ. 2569 (ค.ศ. 2026) 6 รายการ ครอบคลุมทั้ง 3 ประเภท
 * (government/religious/royal) ให้ list/hero/details เห็นข้อมูลจริง — ปีอื่นนอกจาก 2026 มอคยังไม่มี
 * ข้อมูล คืน `[]` (ไม่ crash)
 *
 * scenario สลับได้ผ่าน `setHolidaysScenario()` (dev console หรือเทสต์) มิเรอร์ pattern
 * `setAttendanceHistoryScenario` ใน `attendance.ts`
 */
import { http, HttpResponse } from 'msw'
import type { Holiday } from '@/types/holiday'
import { BASE_URL } from '../base'

export type HolidaysScenario = 'data' | 'empty' | 'error'

let holidaysScenario: HolidaysScenario = 'data'

/** สลับ scenario ของ `GET /holidays` (ใช้ในเทสต์ หรือจาก dev console ตอน `npm run dev`) */
export function setHolidaysScenario(next: HolidaysScenario): void {
  holidaysScenario = next
}

/** reset scenario กลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetCalendarScenarios(): void {
  holidaysScenario = 'data'
}

/** วันหยุดราชการไทยปี พ.ศ. 2569 (ค.ศ. 2026) จริง — ใช้ seed เดียวกับ leave (นับวันทำงาน) และ calendar */
const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'วันขึ้นปีใหม่', nameEn: "New Year's Day", type: 'government' },
  { date: '2026-03-03', name: 'วันมาฆบูชา', nameEn: 'Makha Bucha Day', type: 'religious' },
  { date: '2026-04-06', name: 'วันจักรี', nameEn: 'Chakri Memorial Day', type: 'royal' },
  { date: '2026-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival', type: 'government' },
  { date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', nameEn: 'National Labour Day', type: 'government' },
  {
    date: '2026-07-28',
    name: 'วันเฉลิมพระชนมพรรษาฯ',
    nameEn: "H.M. King's Birthday",
    type: 'royal',
    description: 'พระบาทสมเด็จพระเจ้าอยู่หัว',
  },
]

export const calendarHandlers = [
  http.get(`${BASE_URL}/holidays`, ({ request }) => {
    if (holidaysScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายการวันหยุดไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (holidaysScenario === 'empty') {
      return HttpResponse.json({ data: [] })
    }

    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    if (year !== '2026') {
      return HttpResponse.json({ data: [] })
    }
    return HttpResponse.json({ data: HOLIDAYS_2026 })
  }),
]
