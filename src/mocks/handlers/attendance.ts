/**
 * MSW handler — feature: attendance (§16.3) — `GET /attendance/today` (P11)
 *
 * `office.lat/lng/radiusMeters` = ตำแหน่งตัวอย่างเดิมของ skeleton (P2) — คงค่าไว้ไม่เปลี่ยนกัน
 * เทสต์/mock อื่นที่อาจอ้างอิงพิกัดนี้อยู่แล้ว
 *
 * scenario สลับได้ผ่าน `setAttendanceTodayScenario()` (dev console หรือเทสต์) — default
 * `'not-clocked-in'` เผื่อ ClockPage ของ P12 ทดสอบ state `in-range-ready`/`out-of-range` ก่อน
 * clock-in/out endpoints (P12) ยังไม่ implement ในเฟสนี้ — เพิ่มพร้อม state machine ตอนนั้น
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type AttendanceTodayScenario = 'not-clocked-in' | 'clocked-in' | 'completed'

let scenario: AttendanceTodayScenario = 'not-clocked-in'

/** สลับ scenario ของ `GET /attendance/today` (ใช้ในเทสต์ หรือจาก dev console ตอน `npm run dev`) */
export function setAttendanceTodayScenario(next: AttendanceTodayScenario): void {
  scenario = next
}

const OFFICE = { lat: 13.7563, lng: 100.5018, radiusMeters: 200 }

export const attendanceHandlers = [
  http.get(`${BASE_URL}/attendance/today`, () => {
    switch (scenario) {
      case 'clocked-in':
        return HttpResponse.json({
          data: {
            clockedIn: true,
            clockedOut: false,
            clockInTime: '08:55',
            clockOutTime: null,
            clockInType: 'onsite',
            office: OFFICE,
          },
        })
      case 'completed':
        return HttpResponse.json({
          data: {
            clockedIn: true,
            clockedOut: true,
            clockInTime: '08:55',
            clockOutTime: '18:02',
            clockInType: 'onsite',
            office: OFFICE,
          },
        })
      case 'not-clocked-in':
      default:
        return HttpResponse.json({
          data: {
            clockedIn: false,
            clockedOut: false,
            clockInTime: null,
            clockOutTime: null,
            clockInType: null,
            office: OFFICE,
          },
        })
    }
  }),
]
