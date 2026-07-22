/**
 * MSW handler — feature: leave (§16.3, P14) — `GET /leave/balance?year=` + `GET /leave/requests`
 * (status/type/year/month query) รายละเอียดเต็ม (cancel, create) ยังไม่ทำ — รอ P15/P16
 *
 * 🔴 CONTRACT FLAGS (invented ทั้งชุด — §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน เหมือน
 * สถานการณ์ P13 attendance/history):
 * - `GET /leave/balance` mock ไม่กรองตาม `year` จริง (คืนชุดเดิมทุกปี เพื่อความง่ายของ mock — เหมือน P13
 *   ที่ไม่กรอง `month` จริง)
 * - `GET /leave/requests` mock กรองจริงตาม status/type/year/month (ต่างจาก P13 ที่ไม่กรอง) เพราะ
 *   ข้อมูลตัวอย่างในเฟสนี้เป็น 2 กลุ่มชัดเจน (pending vs history) ที่ต้องแยกแสดงถูกจอ
 * - ข้อมูลตัวอย่างอิงจาก design `2.Pending Requests.png` / `3.History.png` (มิถุนายน 2026 = 2569)
 *
 * scenario สลับได้ผ่าน `setLeaveRequestsScenario()` (dev console หรือเทสต์)
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type LeaveRequestsScenario = 'data' | 'empty' | 'error'

let requestsScenario: LeaveRequestsScenario = 'data'

/** สลับ scenario ของ `GET /leave/requests` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setLeaveRequestsScenario(next: LeaveRequestsScenario): void {
  requestsScenario = next
}

/** reset scenario กลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetLeaveScenarios(): void {
  requestsScenario = 'data'
}

const BALANCE = [
  { type: 'vacation', total: 20, carriedOver: 5, used: 5, pending: 3, remaining: 17 },
  { type: 'sick', total: 30, carriedOver: 0, used: 2, pending: 0, remaining: 28 },
  { type: 'personal', total: 10, carriedOver: 0, used: 1, pending: 0, remaining: 9 },
]

/** ข้อมูลตัวอย่างอิงจาก `2.Pending Requests.png` (3 ใบลาพักร้อนรออนุมัติ มิ.ย. 2569) */
const PENDING_REQUESTS = [
  {
    id: 'leave-pending-1',
    type: 'vacation',
    status: 'PENDING',
    startDate: '2026-06-08',
    endDate: '2026-06-08',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
  },
  {
    id: 'leave-pending-2',
    type: 'vacation',
    status: 'PENDING',
    startDate: '2026-06-16',
    endDate: '2026-06-17',
    totalDays: 2,
    periodSummary: 'เต็มวัน',
  },
  {
    id: 'leave-pending-3',
    type: 'vacation',
    status: 'PENDING',
    startDate: '2026-06-19',
    endDate: '2026-06-19',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
  },
]

/** ข้อมูลตัวอย่างอิงจาก `3.History.png` (อนุมัติแล้วทั้งหมด มิ.ย. 2569) */
const HISTORY_REQUESTS = [
  {
    id: 'leave-history-1',
    type: 'vacation',
    status: 'APPROVED',
    startDate: '2026-06-01',
    endDate: '2026-06-01',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
  },
  {
    id: 'leave-history-2',
    type: 'sick',
    status: 'APPROVED',
    startDate: '2026-06-02',
    endDate: '2026-06-02',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
  },
  {
    id: 'leave-history-3',
    type: 'personal',
    status: 'APPROVED',
    startDate: '2026-06-07',
    endDate: '2026-06-07',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
  },
]

const ALL_REQUESTS = [...PENDING_REQUESTS, ...HISTORY_REQUESTS]

function matchesMonth(dateStr: string, month: number): boolean {
  const [, monthPart] = dateStr.split('-')
  return Number(monthPart) === month
}

function matchesYear(dateStr: string, year: number): boolean {
  const [yearPart] = dateStr.split('-')
  return Number(yearPart) === year
}

export const leaveHandlers = [
  http.get(`${BASE_URL}/leave/balance`, () => {
    return HttpResponse.json({ data: BALANCE })
  }),

  http.get(`${BASE_URL}/leave/requests`, ({ request }) => {
    if (requestsScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายการลาไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (requestsScenario === 'empty') {
      return HttpResponse.json({ data: [] })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const yearParam = url.searchParams.get('year')
    const monthParam = url.searchParams.get('month')

    const filtered = ALL_REQUESTS.filter((item) => {
      if (status && item.status !== status) return false
      if (type && item.type !== type) return false
      if (yearParam && !matchesYear(item.startDate, Number(yearParam))) return false
      if (monthParam && !matchesMonth(item.startDate, Number(monthParam))) return false
      return true
    })

    return HttpResponse.json({ data: filtered })
  }),
]
