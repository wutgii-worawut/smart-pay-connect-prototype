/**
 * MSW handler — feature: calendar (§16.3) — `GET /holidays?year=` (P17 enrich → `Holiday[]`, ใช้ร่วม
 * กับ leave ผ่าน `useHolidays` — D1 plan.md §1) + `/leave/calendar` (P18 — จอ 6.1 Leave Calendar)
 *
 * P17: seed วันหยุดราชการไทยจริงของปี พ.ศ. 2569 (ค.ศ. 2026) 6 รายการ ครอบคลุมทั้ง 3 ประเภท
 * (government/religious/royal) ให้ list/hero/details เห็นข้อมูลจริง — ปีอื่นนอกจาก 2026 มอคยังไม่มี
 * ข้อมูล คืน `[]` (ไม่ crash)
 *
 * P18: seed เดือนปัจจุบัน '2026-07' (วันนี้ตาม memory 2026-07-22) ให้มีจุดครบทั้ง 3 ประเภท กระจาย 6 วัน
 * รวมวันที่ 2026-07-10 ที่มีหลายประเภทในวันเดียว (ทดสอบว่า DayButton โชว์ได้หลายจุด) + รายละเอียดต่อวัน
 * ที่ `/leave/calendar/{date}` — วันที่ 2026-07-22 (default selectedDate ของ `LeaveCalendarView`) seed
 * ให้มี 2 คนลาพักร้อน (ชื่อเดียวกับตัวอย่างใน design PNG) ให้ manual test เห็น detail ทันทีตอนเปิดหน้า —
 * เดือน/วันที่อื่นนอกเหนือจากที่ seed คืน `[]` (ไม่ crash เหมือน holidays)
 *
 * scenario สลับได้ผ่าน `setHolidaysScenario()` (dev console หรือเทสต์) มิเรอร์ pattern
 * `setAttendanceHistoryScenario` ใน `attendance.ts` — `/leave/calendar` ไม่ทำ scenario helper แยก
 * (ไม่บังคับตาม P18 spec) เทสต์ที่ต้องการ error path ใช้ `server.use()` override เฉพาะเคสแทน
 */
import { http, HttpResponse } from 'msw'
import type { Holiday } from '@/types/holiday'
import type { LeaveType } from '@/types/leave'
import { BASE_URL } from '../base'

/** shape ของ response `/leave/calendar` (มิเรอร์ `LeaveCalendarDay`/`LeaveDayDetailEntry` ของ
 * `features/calendar/types/leaveCalendar.ts` ตรง ๆ — ประกาศ local แทนการ import ข้าม feature เพื่อคง
 * รูปแบบเดิมของไฟล์นี้ที่ mock handler ไม่ import type จาก `features/*` เลย, ใช้แค่ `@/types/*` ที่ share ได้) */
interface LeaveCalendarDayResponse {
  date: string
  types: LeaveType[]
}

interface LeaveDayDetailEntryResponse {
  employeeName: string
  type: LeaveType
  period: string
}

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

/**
 * "ชั้นปฏิทิน" เดือน 2026-07 (วันนี้ตาม memory 2026-07-22) — ครบทั้ง 3 ประเภท:
 * vacation (03, 10, 22) / sick (08, 17) / personal (10, 14) — วันที่ 10 มีสองประเภทซ้อน (multi-dot)
 */
const LEAVE_CALENDAR_2026_07: LeaveCalendarDayResponse[] = [
  { date: '2026-07-03', types: ['vacation'] },
  { date: '2026-07-08', types: ['sick'] },
  { date: '2026-07-10', types: ['vacation', 'personal'] },
  { date: '2026-07-14', types: ['personal'] },
  { date: '2026-07-17', types: ['sick'] },
  { date: '2026-07-22', types: ['vacation'] },
]

/** "ชั้นรายละเอียด" ต่อวัน — วันที่ 2026-07-22 (default selectedDate) ใช้ชื่อเดียวกับตัวอย่างใน design PNG */
const LEAVE_DAY_DETAILS: Record<string, LeaveDayDetailEntryResponse[]> = {
  '2026-07-03': [{ employeeName: 'นายกุหลาบ ประพฤติดี', type: 'vacation', period: 'เต็มวัน' }],
  '2026-07-08': [{ employeeName: 'นางสาวพิมพ์ใจ ดีเลิศ', type: 'sick', period: 'เต็มวัน' }],
  '2026-07-10': [
    { employeeName: 'นายชล สมมุติ', type: 'vacation', period: 'เต็มวัน' },
    { employeeName: 'นางสาวรุ่งนภา แจ่มใส', type: 'personal', period: 'ครึ่งบ่าย' },
  ],
  '2026-07-14': [{ employeeName: 'นายวิชัย ตั้งใจ', type: 'personal', period: 'เต็มวัน' }],
  '2026-07-17': [{ employeeName: 'นางสมศรี ขยันดี', type: 'sick', period: 'ครึ่งเช้า' }],
  '2026-07-22': [
    { employeeName: 'นายกุหลาบ ประพฤติดี', type: 'vacation', period: 'เต็มวัน' },
    { employeeName: 'นายชล สมมุติ', type: 'vacation', period: 'เต็มวัน' },
  ],
}

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

  http.get(`${BASE_URL}/leave/calendar`, ({ request }) => {
    const url = new URL(request.url)
    const month = url.searchParams.get('month')
    if (month !== '2026-07') {
      return HttpResponse.json({ data: [] })
    }
    return HttpResponse.json({ data: LEAVE_CALENDAR_2026_07 })
  }),

  http.get(`${BASE_URL}/leave/calendar/:date`, ({ params }) => {
    const date = typeof params.date === 'string' ? params.date : ''
    return HttpResponse.json({ data: LEAVE_DAY_DETAILS[date] ?? [] })
  }),
]
