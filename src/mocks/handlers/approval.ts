/**
 * MSW handler — feature: approval (§16.3, §17.5) — เฉพาะ role: manager
 * `GET /approval/pending` (P19) + `GET /approval/history?year=&month=` (P19) — approve/reject
 * (P20) ยังไม่ทำในไฟล์นี้
 *
 * 🔴 CONTRACT FLAGS (invented ทั้งชุด — §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน เหมือน
 * สถานการณ์เดียวกับ P14 `GET /leave/requests`):
 * - shape ตรงกับ `LeaveRequest` (D2 plan.md §1) + `employeeName` เสมอ (ต่างจากฝั่งพนักงานที่ไม่มี field นี้)
 * - ข้อมูลตัวอย่างอิงจาก design `1.Pending List.png` (นายกุหลาบ ประพฤติดี ลาพักร้อน 2 ใบ มิ.ย. 2569) /
 *   `4.History.png` (อนุมัติแล้ว 2 ใบ)
 * - `GET /approval/history` mock ไม่กรองตาม `year`/`month` จริง (คืนชุดเดิมทุกเดือน/ปี เพื่อความง่าย
 *   ของ mock — เหมือน P13/P14 balance ที่ไม่กรองจริงเช่นกัน)
 *
 * scenario สลับได้ผ่าน `setApprovalPendingScenario()` / `setApprovalHistoryScenario()` (dev console
 * หรือเทสต์) — มิเรอร์ `setAttendanceHistoryScenario`
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

/** reset scenario ทั้งหมดกลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetApprovalScenarios(): void {
  pendingScenario = 'data'
  historyScenario = 'data'
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
]
