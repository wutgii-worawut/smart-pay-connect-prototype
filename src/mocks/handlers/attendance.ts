/**
 * MSW handler — feature: attendance (§16.3) — `GET /attendance/today` (P11) +
 * `POST /attendance/clock-in`/`clock-out` (P12)
 *
 * `office.lat/lng/radiusMeters` = ตำแหน่งตัวอย่างเดิมของ skeleton (P2) — คงค่าไว้ไม่เปลี่ยนกัน
 * เทสต์/mock อื่นที่อาจอ้างอิงพิกัดนี้อยู่แล้ว
 *
 * scenario สลับได้ผ่าน `setAttendanceTodayScenario()` (dev console หรือเทสต์)
 *
 * ⚠️ CONTRACT FLAGS เพิ่มจาก P11 (ดู plan/progress.md บันทึกแก้แผน P11 ข้อ 3 + P12 types/attendance.ts):
 * - `office.name`/`office.address`, `canRemoteClock`, `date` เป็น field ใหม่ที่ P12 เพิ่ม (ไม่มีใน
 *   P11 shape เดิม) — invented ฝั่งเราทั้งหมด รอ backend/swagger ยืนยัน
 * - `POST /attendance/clock-in`/`clock-out` ยังไม่เคย probe กับ mock service จริง (endpoint จาก
 *   §16.3 เท่านั้น) — error scenario (`OUT_OF_GEOFENCE`/`ALREADY_CLOCKED_IN`) คุมผ่าน
 *   `setClockActionScenario()` สำหรับเทสต์/dev console
 */
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { BASE_URL } from '../base'

export type AttendanceTodayScenario = 'not-clocked-in' | 'clocked-in' | 'clocked-in-remote' | 'completed'

let scenario: AttendanceTodayScenario = 'not-clocked-in'

/** สลับ scenario ของ `GET /attendance/today` (ใช้ในเทสต์ หรือจาก dev console ตอน `npm run dev`) */
export function setAttendanceTodayScenario(next: AttendanceTodayScenario): void {
  scenario = next
}

/** ควบคุมผลของ `POST /attendance/clock-in`/`clock-out` ในเทสต์/dev console */
export type ClockActionScenario = 'success' | 'out-of-geofence' | 'already-clocked-in'

let clockActionScenario: ClockActionScenario = 'success'

export function setClockActionScenario(next: ClockActionScenario): void {
  clockActionScenario = next
}

/** reset ทั้งสอง scenario กลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetAttendanceScenarios(): void {
  scenario = 'not-clocked-in'
  clockActionScenario = 'success'
}

const OFFICE = {
  lat: 13.7563,
  lng: 100.5018,
  radiusMeters: 200,
  name: 'บริษัท คอมพิวเตอร์ จำกัด',
  address: 'อาคาร SP, 109 แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร',
}

const TODAY_DATE = '2026-07-21'

/** body ของ clock-in/clock-out ไม่มี Zod schema ที่ export จาก types/attendance.ts (ยังเป็น prod
 * type เฉย ๆ) — narrow ปลอดภัยตอน parse body ของ mock ด้วย schema เล็ก ๆ ในนี้แทน `as` (code-style.md) */
const clockActionBodySchema = z.object({
  type: z.enum(['onsite', 'remote']).optional(),
})

async function parseClockActionType(request: Request): Promise<'onsite' | 'remote'> {
  const parsed = clockActionBodySchema.safeParse(await request.json())
  return parsed.success ? (parsed.data.type ?? 'onsite') : 'onsite'
}

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
            canRemoteClock: true,
            date: TODAY_DATE,
          },
        })
      case 'clocked-in-remote':
        return HttpResponse.json({
          data: {
            clockedIn: true,
            clockedOut: false,
            clockInTime: '07:50',
            clockOutTime: null,
            clockInType: 'remote',
            office: OFFICE,
            canRemoteClock: true,
            date: TODAY_DATE,
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
            canRemoteClock: true,
            date: TODAY_DATE,
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
            canRemoteClock: true,
            date: TODAY_DATE,
          },
        })
    }
  }),

  http.post(`${BASE_URL}/attendance/clock-in`, async ({ request }) => {
    const type = await parseClockActionType(request)

    if (clockActionScenario === 'out-of-geofence') {
      return HttpResponse.json(
        { error: { code: 'OUT_OF_GEOFENCE', message: 'ตำแหน่งของคุณอยู่นอกรัศมีที่กำหนด' } },
        { status: 422 },
      )
    }
    if (clockActionScenario === 'already-clocked-in') {
      return HttpResponse.json(
        { error: { code: 'ALREADY_CLOCKED_IN', message: 'คุณลงเวลาเข้างานไปแล้ว' } },
        { status: 409 },
      )
    }

    // F6: flip `GET /attendance/today` scenario ให้ตรงผลลงเวลาเข้าจริง กัน refetch หลังสำเร็จ
    // ตอบกลับ "ยังไม่ได้ลงเวลา" (overlay สำเร็จปิดแล้วเด้งกลับ in-range-ready)
    scenario = type === 'remote' ? 'clocked-in-remote' : 'clocked-in'

    return HttpResponse.json({
      data: { date: TODAY_DATE, time: '07:50', type },
    })
  }),

  http.post(`${BASE_URL}/attendance/clock-out`, async ({ request }) => {
    const type = await parseClockActionType(request)

    if (clockActionScenario === 'out-of-geofence') {
      return HttpResponse.json(
        { error: { code: 'OUT_OF_GEOFENCE', message: 'ตำแหน่งของคุณอยู่นอกรัศมีที่กำหนด' } },
        { status: 422 },
      )
    }
    if (clockActionScenario === 'already-clocked-in') {
      return HttpResponse.json(
        { error: { code: 'NOT_CLOCKED_IN', message: 'คุณยังไม่ได้ลงเวลาเข้างานวันนี้' } },
        { status: 409 },
      )
    }

    // F6: flip ไป completed หลังลงเวลาออกสำเร็จ
    scenario = 'completed'

    return HttpResponse.json({
      data: { date: TODAY_DATE, time: '17:05', type },
    })
  }),
]
