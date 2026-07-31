/**
 * MSW handler — feature: leave (§16.3, P14+P15+P16) — `GET /leave/balance?year=` + `GET
 * /leave/requests` (status/type/year/month query) + `GET /leave/requests/{id}` + `POST
 * /leave/requests/{id}/cancel` + `POST /leave/requests` (P16 — สร้างใบลา, จอ 6.1/6.2 → 7)
 * `GET /employees/teammates` (P16, ผู้ปฏิบัติงานแทน + ผู้อนุมัติ) อยู่คนละไฟล์ —
 * `src/mocks/handlers/employees.ts`
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
 * - `POST /leave/requests` (P16): **request body มีระบุจริงใน §16.3** (`leaveType`/`days`/`reason`/
 *   `substituteId?`) — mock parse field ชื่อนี้ตรง ๆ ไม่ได้สมมติเอง (`parseCreateLeaveBody` ด้านล่าง)
 *   response shape ยังคง invented รอ swagger เหมือนเดิม (แก้จาก draft เดิมที่ผิดว่า request ไม่มีสัญญา
 *   — consultant review 2026-07-22)
 *
 * scenario สลับได้ผ่าน `setLeaveRequestsScenario()` / `setLeaveDetailScenario()` (dev console หรือเทสต์)
 */
import { http, HttpResponse } from 'msw'
import { sumLeaveDays } from '@/utils/date'
import type { LeaveDayEntry } from '@/types/leave'
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

/**
 * scenario ของ `POST /leave/requests` (P16 — ฟอร์มสร้างใบลา):
 * - 'success'           → **ไม่ได้แปลว่าสำเร็จเสมอ** — handler ยัง enforce โควตาจริงต่อจากนี้เทียบกับ
 *   `BALANCE` (ตัวเดียวกับ `GET /leave/balance`) เสมอ: สำเร็จก็ต่อเมื่อ `sumLeaveDays(days)` ของ
 *   `leaveType` ที่ขอ ≤ `remaining` ของประเภทนั้น ไม่งั้นตอบ 422 `QUOTA_EXCEEDED` เหมือนเคส override
 *   ด้านล่าง (bug fix 2026-07-31 — เดิม mock ปล่อยผ่านทุกจำนวนวันเมื่อ scenario เป็น 'success' ทำให้
 *   เส้นทาง `QUOTA_EXCEEDED` ยิงเองไม่ได้เลยตอนใช้งานปกติ ต้องสลับ scenario ด้วยมือเท่านั้น)
 * - 'quota-exceeded'    → บังคับ 422 `QUOTA_EXCEEDED` เสมอ (ไม่เช็คโควตาจริง) — ใช้ตอนต้องการยืนยัน
 *   error path แน่ ๆ ไม่ต้องพึ่ง payload/balance ปัจจุบัน — `LeaveForm` โชว์ error ที่ช่อง `dateRange`
 * - 'validation-error'  → 422 `VALIDATION_ERROR` — `LeaveForm` โชว์ error ที่ root (เหนือปุ่มส่ง)
 * - 'error'             → 500 ทั่วไป — toast
 */
export type LeaveCreateScenario = 'success' | 'quota-exceeded' | 'validation-error' | 'error'

let createScenario: LeaveCreateScenario = 'success'

/** สลับ scenario ของ `POST /leave/requests` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setLeaveCreateScenario(next: LeaveCreateScenario): void {
  createScenario = next
}

/** reset scenario ทั้งหมดกลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetLeaveScenarios(): void {
  requestsScenario = 'data'
  detailScenario = 'pending'
  createScenario = 'success'
}

/** shape mirror ตรง §16.3: `{leaveType, days:[{date,period}], reason, substituteId?}` — `days` ใช้
 * `LeaveDayEntry` ตัวเดียวกับฟอร์ม/`sumLeaveDays` (ไม่ประกาศ `period: string` แยกเอง) เพื่อเรียก
 * `sumLeaveDays(body.days)` ตรง ๆ ตอนเช็คโควตาด้านล่างได้โดยไม่ต้อง cast */
interface CreateLeaveBody {
  leaveType?: string
  days?: LeaveDayEntry[]
  substituteId?: string
}

/** แปลง request body ของ POST /leave/requests เป็นรูปกลาง — รองรับทั้ง JSON ปกติ (ไม่มีไฟล์แนบ) และ
 * multipart/form-data (มีไฟล์แนบ, `days` มาเป็น JSON string ใน field เดี่ยว — ดู CONTRACT FLAG ที่
 * `api/createLeave.ts`) — field name ตรง §16.3 (`leaveType`/`substituteId`) */
async function parseCreateLeaveBody(request: Request): Promise<CreateLeaveBody> {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const daysRaw = form.get('days')
    const substituteIdRaw = form.get('substituteId')
    return {
      leaveType: typeof form.get('leaveType') === 'string' ? String(form.get('leaveType')) : undefined,
      days: typeof daysRaw === 'string' ? (JSON.parse(daysRaw) as CreateLeaveBody['days']) : undefined,
      substituteId: typeof substituteIdRaw === 'string' ? substituteIdRaw : undefined,
    }
  }
  return (await request.json()) as CreateLeaveBody
}

function periodSummaryOf(days: { date: string; period: string }[]): string {
  if (days.length === 0) return ''
  if (days.length > 1) return 'ผสม'
  if (days[0].period === 'full') return 'เต็มวัน'
  return days[0].period === 'am' ? 'ครึ่งวัน (เช้า)' : 'ครึ่งวัน (บ่าย)'
}

/** ข้อความ error เดียวกันทั้ง 2 เส้นทางที่คืน `QUOTA_EXCEEDED` (scenario override + เช็คโควตาจริงด้านล่าง) */
const QUOTA_EXCEEDED_MESSAGE = 'วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก'

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
  submittedAt: '2026-06-15T08:30:00Z',
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
  submittedAt: '2026-05-10T08:30:00Z',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: '2026-05-14T08:30:00Z',
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

  http.post(`${BASE_URL}/leave/requests`, async ({ request }) => {
    if (createScenario === 'quota-exceeded') {
      return HttpResponse.json(
        { error: { code: 'QUOTA_EXCEEDED', message: QUOTA_EXCEEDED_MESSAGE } },
        { status: 422 },
      )
    }
    if (createScenario === 'validation-error') {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'ข้อมูลคำขอลาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' } },
        { status: 422 },
      )
    }
    if (createScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'ส่งคำขอลาไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }

    const body = await parseCreateLeaveBody(request)
    const type = body.leaveType ?? 'vacation'
    const days = body.days ?? []

    // [P22 consultant follow-up] days ว่าง = payload ไม่ถูกต้อง (Zod ฟอร์มด่านเข้มกันไว้อยู่แล้ว —
    // เคสนี้จำลอง backend จริงที่ต้องปฏิเสธด้วย 422 ไม่ใช่คืน startDate/endDate เป็น '' ที่ผ่าน
    // `z.iso.date()` ของ `createLeave.ts` ไม่ได้ (Zod parse throw ดิบแทน error ที่อ่านได้)
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    if (!firstDay || !lastDay) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'ต้องระบุวันลาอย่างน้อย 1 วัน' } },
        { status: 422 },
      )
    }

    const totalDays = sumLeaveDays(days)

    // เทียบโควตาจริงกับ `BALANCE` (single source เดียวกับ `GET /leave/balance` ด้านบน — ห้าม
    // hardcode เลขซ้ำ) เพื่อให้ `QUOTA_EXCEEDED` ยิงเองได้ตอนใช้งานปกติ ไม่ต้องพึ่งสลับ scenario ด้วยมือ
    // (bug fix 2026-07-31 — ดู doc-comment `LeaveCreateScenario` ด้านบน) — ไม่พบประเภทใน `BALANCE` →
    // ปล่อยผ่าน (ไม่ใช่เคสที่ mock ต้องตัดสิน)
    const balanceEntry = BALANCE.find((b) => b.type === type)
    if (balanceEntry && totalDays > balanceEntry.remaining) {
      return HttpResponse.json(
        { error: { code: 'QUOTA_EXCEEDED', message: QUOTA_EXCEEDED_MESSAGE } },
        { status: 422 },
      )
    }

    return HttpResponse.json({
      data: {
        id: 'leave-new-1',
        requestNumber: 'ล 0722/11',
        status: 'PENDING',
        type,
        startDate: firstDay.date,
        endDate: lastDay.date,
        totalDays,
        periodSummary: periodSummaryOf(days),
      },
    })
  }),
]
