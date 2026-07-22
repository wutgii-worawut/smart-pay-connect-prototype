/**
 * MSW handler — feature: approval (§16.3, §17.5) — เฉพาะ role: manager
 * `GET /approval/pending` (P19) + `GET /approval/history?year=&month=` (P19) + `GET
 * /approval/requests/{id}` + `POST /approval/requests/{id}/approve` + `POST
 * /approval/requests/{id}/reject` (P20)
 *
 * 🔴 CONTRACT FLAGS (invented ทั้งชุด — §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน เหมือน
 * สถานการณ์เดียวกับ P14 `GET /leave/requests`):
 * - shape ตรงกับ `LeaveRequest`/`LeaveRequestDetail` (D2 plan.md §1) + `employeeName` เสมอ (ต่างจาก
 *   ฝั่งพนักงานที่ไม่มี field นี้) + `remainingBalance`/`approverComment` เฉพาะ detail (P20)
 * - ข้อมูลตัวอย่างอิงจาก design `1.Pending List.png` (นายกุหลาบ ประพฤติดี ลาพักร้อน 2 ใบ มิ.ย. 2569) /
 *   `4.History.png` (อนุมัติแล้ว 2 ใบ) / `2.Pending Details.png` (วันลาคงเหลือ 20 วัน) /
 *   `5.History Details - Approved.png` (วันลาคงเหลือ 21 วัน หลังอนุมัติ)
 * - `GET /approval/history` mock ไม่กรองตาม `year`/`month` จริง (คืนชุดเดิมทุกเดือน/ปี เพื่อความง่าย
 *   ของ mock — เหมือน P13/P14 balance ที่ไม่กรองจริงเช่นกัน)
 * - `GET /approval/requests/{id}` mock **ไม่กรองตาม `:id` จริง** (คืนตัวอย่างชุดเดียวตาม scenario
 *   ปัจจุบัน เหมือนกันทุก id ที่ยิงมา — มิเรอร์ `GET /leave/requests/{id}` ของ P15)
 * - `POST .../approve` + `.../reject` response shape invented — mock ไม่ persist สถานะจริง คืนแค่
 *   `{id, status}` แบบง่าย (client ไม่ parse response อยู่แล้ว — ดู CONTRACT FLAG ที่ `api/approve.ts`/
 *   `api/reject.ts`)
 *
 * scenario สลับได้ผ่าน `setApprovalPendingScenario()` / `setApprovalHistoryScenario()` /
 * `setApprovalDetailScenario()` / `setApprovalActionScenario()` (dev console หรือเทสต์) — มิเรอร์
 * `setAttendanceHistoryScenario` / `setLeaveDetailScenario`
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type ApprovalPendingScenario = 'data' | 'empty' | 'error'

let pendingScenario: ApprovalPendingScenario = 'data'

/** สลับ scenario ของ `GET /approval/pending` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setApprovalPendingScenario(next: ApprovalPendingScenario): void {
  pendingScenario = next
}

export type ApprovalHistoryScenario = 'data' | 'empty' | 'error'

let historyScenario: ApprovalHistoryScenario = 'data'

/** สลับ scenario ของ `GET /approval/history` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setApprovalHistoryScenario(next: ApprovalHistoryScenario): void {
  historyScenario = next
}

/**
 * scenario ของ `GET /approval/requests/{id}` (P20):
 * - 'pending'  → detail PENDING (`2.Pending Details.png`) → mode `approver-action`
 * - 'approved' → detail APPROVED read-only (`5.History Details - Approved.png`) → mode `approver-view`
 * - 'error'    → GET ล้มเหลว 500 (ทดสอบ ErrorState)
 */
export type ApprovalDetailScenario = 'pending' | 'approved' | 'error'

let detailScenario: ApprovalDetailScenario = 'pending'

/** สลับ scenario ของ detail (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setApprovalDetailScenario(next: ApprovalDetailScenario): void {
  detailScenario = next
}

/**
 * scenario ของ `POST /approval/requests/{id}/approve` + `/reject` (P20) — แยกจาก `detailScenario`
 * เพื่อทดสอบ mutation ล้มเหลวได้อิสระโดยไม่ต้องพึ่งพา GET detail ให้ error ไปด้วย:
 * - 'success'     → อนุมัติ/ไม่อนุมัติสำเร็จ
 * - 'not-pending' → 409 `REQUEST_NOT_PENDING` (จำลอง race condition: ใบถูกตัดสินไปแล้วพอดี)
 * - 'error'       → 500 ทั่วไป
 */
export type ApprovalActionScenario = 'success' | 'not-pending' | 'error'

let actionScenario: ApprovalActionScenario = 'success'

/** สลับ scenario ของ approve/reject (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setApprovalActionScenario(next: ApprovalActionScenario): void {
  actionScenario = next
}

/** reset scenario ทั้งหมดกลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetApprovalScenarios(): void {
  pendingScenario = 'data'
  historyScenario = 'data'
  detailScenario = 'pending'
  actionScenario = 'success'
}

/** ข้อมูลตัวอย่างอิงจาก `1.Pending List.png` (นายกุหลาบ ประพฤติดี ลาพักร้อน 2 ใบ มิ.ย. 2569) */
const PENDING_REQUESTS = [
  {
    id: 'approval-pending-1',
    type: 'vacation',
    status: 'PENDING',
    startDate: '2026-06-08',
    endDate: '2026-06-08',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
    employeeName: 'นายกุหลาบ ประพฤติดี',
  },
  {
    id: 'approval-pending-2',
    type: 'vacation',
    status: 'PENDING',
    startDate: '2026-06-16',
    endDate: '2026-06-17',
    totalDays: 2,
    periodSummary: 'เต็มวัน',
    employeeName: 'นายกุหลาบ ประพฤติดี',
  },
]

/** ข้อมูลตัวอย่างอิงจาก `4.History.png` (อนุมัติแล้วทั้งคู่ มิ.ย. 2569) */
const HISTORY_REQUESTS = [
  {
    id: 'approval-history-1',
    type: 'vacation',
    status: 'APPROVED',
    startDate: '2026-06-08',
    endDate: '2026-06-08',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
    employeeName: 'นายกุหลาบ ประพฤติดี',
  },
  {
    id: 'approval-history-2',
    type: 'vacation',
    status: 'APPROVED',
    startDate: '2026-06-01',
    endDate: '2026-06-01',
    totalDays: 1,
    periodSummary: 'เต็มวัน',
    employeeName: 'นายกุหลาบ ประพฤติดี',
  },
]

/** ข้อมูลตัวอย่างอิงจาก `2.Pending Details.png` (นายกุหลาบ ประพฤติดี, ลาพักร้อน, วันลาคงเหลือ 20 วัน) */
const PENDING_DETAIL = {
  id: 'approval-pending-1',
  type: 'vacation',
  status: 'PENDING',
  requestNumber: 'ล 0608/10',
  startDate: '2026-06-08',
  endDate: '2026-06-08',
  days: [{ date: '2026-06-08', period: 'full' }],
  totalDays: 1,
  periodSummary: 'เต็มวัน',
  reason: 'เดินทาง',
  submittedAt: '2026-05-25',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: null,
  attachments: [{ id: 'att-1', name: 'หนังสือขออนุญาตไปต่างประเทศ.pdf', sizeLabel: '120 KB' }],
  employeeName: 'นายกุหลาบ ประพฤติดี',
  remainingBalance: 20,
}

/** ข้อมูลตัวอย่างอิงจาก `5.History Details - Approved.png` (วันลาคงเหลือ 21 วัน หลังอนุมัติ) */
const APPROVED_DETAIL = {
  id: 'approval-history-1',
  type: 'vacation',
  status: 'APPROVED',
  requestNumber: 'ล 0601/09',
  startDate: '2026-06-01',
  endDate: '2026-06-01',
  days: [{ date: '2026-06-01', period: 'full' }],
  totalDays: 1,
  periodSummary: 'เต็มวัน',
  reason: 'เดินทางต่างจังหวัดกับครอบครัว',
  submittedAt: '2026-05-25',
  proxyName: 'นายแทนคุณ สมมุติ',
  approverName: 'คุณวิชัย มั่นคง',
  approvedAt: '2026-06-01',
  attachments: [{ id: 'att-1', name: 'หนังสือขออนุญาตไปต่างประเทศ.pdf', sizeLabel: '120 KB' }],
  employeeName: 'นายกุหลาบ ประพฤติดี',
  remainingBalance: 21,
  // [P22 P20 (ง)] เติมตัวอย่างความเห็นผู้อนุมัติ (mock-only) — ให้ manual test เห็นจอ 4.5 ครบ
  // (DetailField read-only ของ approver-view โชว์ค่านี้เมื่อมี — ดู LeaveRequestDetailCard.tsx)
  approverComment: 'อนุมัติ กรุณาส่งมอบงานให้ทีมก่อนวันลา',
}

export const approvalHandlers = [
  http.get(`${BASE_URL}/approval/pending`, () => {
    if (pendingScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายการรออนุมัติไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (pendingScenario === 'empty') {
      return HttpResponse.json({ data: [] })
    }
    return HttpResponse.json({ data: PENDING_REQUESTS })
  }),

  http.get(`${BASE_URL}/approval/history`, () => {
    if (historyScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดประวัติการอนุมัติไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (historyScenario === 'empty') {
      return HttpResponse.json({ data: [] })
    }
    return HttpResponse.json({ data: HISTORY_REQUESTS })
  }),

  http.get(`${BASE_URL}/approval/requests/:id`, () => {
    if (detailScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายละเอียดใบลาไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (detailScenario === 'approved') {
      return HttpResponse.json({ data: APPROVED_DETAIL })
    }
    return HttpResponse.json({ data: PENDING_DETAIL })
  }),

  http.post(`${BASE_URL}/approval/requests/:id/approve`, ({ params }) => {
    if (actionScenario === 'not-pending') {
      return HttpResponse.json(
        { error: { code: 'REQUEST_NOT_PENDING', message: 'คำขอนี้ถูกดำเนินการไปแล้ว กรุณาลองใหม่' } },
        { status: 409 },
      )
    }
    if (actionScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'อนุมัติคำขอไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    return HttpResponse.json({ data: { id: params.id, status: 'APPROVED' } })
  }),

  http.post(`${BASE_URL}/approval/requests/:id/reject`, ({ params }) => {
    if (actionScenario === 'not-pending') {
      return HttpResponse.json(
        { error: { code: 'REQUEST_NOT_PENDING', message: 'คำขอนี้ถูกดำเนินการไปแล้ว กรุณาลองใหม่' } },
        { status: 409 },
      )
    }
    if (actionScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'ไม่อนุมัติคำขอไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    return HttpResponse.json({ data: { id: params.id, status: 'REJECTED' } })
  }),
]
