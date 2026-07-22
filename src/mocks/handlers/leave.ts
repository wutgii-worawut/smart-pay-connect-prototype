/**
 * MSW handler — feature: leave (§16.3, P14+P15) — `GET /leave/balance?year=` + `GET /leave/requests`
 * (status/type/year/month query) + `GET /leave/requests/{id}` + `POST /leave/requests/{id}/cancel`
 * ฟอร์มสร้างใบลา (P16) ยังไม่ทำ
 *
 * 🔴 CONTRACT FLAGS (invented ทั้งชุด — §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน เหมือน
 * สถานการณ์ P13 attendance/history):
 * - `GET /leave/balance` mock ไม่กรองตาม `year` จริง (คืนชุดเดิมทุกปี เพื่อความง่ายของ mock — เหมือน P13
 *   ที่ไม่กรอง `month` จริง)
 * - `GET /leave/requests` mock กรองจริงตาม status/type/year/month (ต่างจาก P13 ที่ไม่กรอง) เพราะ
 *   ข้อมูลตัวอย่างในเฟสนี้เป็น 2 กลุ่มชัดเจน (pending vs history) ที่ต้องแยกแสดงถูกจอ
 * - ข้อมูลตัวอย่างอิงจาก design `2.Pending Requests.png` / `3.History.png` (มิถุนายน 2026 = 2569)
 * - `GET /leave/requests/{id}` mock **ไม่กรองตาม `:id` จริง** (คืนตัวอย่างชุดเดียวตาม scenario ปัจจุบัน
 *   เหมือนกันทุก id ที่ยิงมา — เพียงพอสำหรับทดสอบ 3 state ของการ์ด detail ในเฟสนี้ ยังไม่ผูกกับ
 *   ALL_REQUESTS จริง — พอ backend probe ได้ค่อยทำ mock ให้ผูก id จริง)
 * - `POST /leave/requests/{id}/cancel` response shape invented — mock คืน `{ id, status:
 *   'CANCELLED' }` แบบง่าย (ดู CONTRACT FLAG ที่ `api/cancelRequest.ts` — client ไม่ parse response
 *   จริงอยู่แล้ว)
 *
 * scenario สลับได้ผ่าน `setLeaveRequestsScenario()` / `setLeaveDetailScenario()` (dev console หรือเทสต์)
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type LeaveRequestsScenario = 'data' | 'empty' | 'error'

let requestsScenario: LeaveRequestsScenario = 'data'

/** สลับ scenario ของ `GET /leave/requests` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setLeaveRequestsScenario(next: LeaveRequestsScenario): void {
  requestsScenario = next
}

/**
 * scenario ของ `GET /leave/requests/{id}` + `POST /leave/requests/{id}/cancel` (P15):
 * - 'pending'     → detail PENDING (8.Sended Pending Details) — cancel สำเร็จ
 * - 'approved'    → detail APPROVED read-only (4.History Details) — ไม่มีปุ่มยกเลิกให้กดอยู่แล้ว
 * - 'error'       → GET ล้มเหลว 500 (ทดสอบ ErrorState)
 * - 'not-pending' → detail เหมือน 'pending' แต่ POST cancel ตอบ 409 REQUEST_NOT_PENDING (จำลอง race
 *   condition: หัวหน้าอนุมัติ/ปฏิเสธไปพร้อมกันขณะเจ้าของกำลังกดยกเลิก)
 */
export type LeaveDetailScenario = 'pending' | 'approved' | 'error' | 'not-pending'

let detailScenario: LeaveDetailScenario = 'pending'

/** สลับ scenario ของ detail + cancel (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setLeaveDetailScenario(next: LeaveDetailScenario): void {
  detailScenario = next
}

/** reset scenario ทั้งหมดกลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetLeaveScenarios(): void {
  requestsScenario = 'data'
  detailScenario = 'pending'
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

/** ข้อมูลตัวอย่างอิงจาก `8. Sended Pending Details.png` */
const PENDING_DETAIL = {
  id: 'leave-pending-3',
  type: 'vacation',
  status: 'PENDING',
  requestNumber: 'ล 0706/10',
  startDate: '2026-06-19',
  endDate: '2026-06-19',
  days: [{ date: '2026-06-19', period: 'full' }],
  totalDays: 1,
  periodSummary: 'เต็มวัน',
  reason: 'เดินทางต่างจังหวัดกับครอบครัว',
  submittedAt: '2026-06-15',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: null,
  attachments: [{ id: 'att-1', name: 'ใบจองที่พัก.pdf', sizeLabel: '120 KB' }],
}

/** ข้อมูลตัวอย่างอิงจาก `4.History Details.png` (หลายวันผสมครึ่งวัน อนุมัติแล้ว) */
const APPROVED_DETAIL = {
  id: 'leave-history-1',
  type: 'vacation',
  status: 'APPROVED',
  requestNumber: 'ล 0605/10',
  startDate: '2026-05-12',
  endDate: '2026-05-14',
  days: [
    { date: '2026-05-12', period: 'full' },
    { date: '2026-05-13', period: 'am' },
    { date: '2026-05-14', period: 'pm' },
  ],
  totalDays: 2,
  periodSummary: 'เต็มวัน',
  reason: 'เดินทางต่างจังหวัดกับครอบครัว',
  submittedAt: '2026-05-10',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: '2026-05-14',
  attachments: [],
}

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

  http.get(`${BASE_URL}/leave/requests/:id`, () => {
    if (detailScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายละเอียดใบลาไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (detailScenario === 'approved') {
      return HttpResponse.json({ data: APPROVED_DETAIL })
    }
    // 'pending' | 'not-pending' → detail หน้าตาเหมือนกัน ต่างกันแค่ผลของ POST cancel ด้านล่าง
    return HttpResponse.json({ data: PENDING_DETAIL })
  }),

  http.post(`${BASE_URL}/leave/requests/:id/cancel`, ({ params }) => {
    if (detailScenario === 'not-pending') {
      return HttpResponse.json(
        {
          error: {
            code: 'REQUEST_NOT_PENDING',
            message: 'คำขอนี้ไม่อยู่ในสถานะที่ยกเลิกได้',
          },
        },
        { status: 409 },
      )
    }
    return HttpResponse.json({ data: { id: params.id, status: 'CANCELLED' } })
  }),
]
