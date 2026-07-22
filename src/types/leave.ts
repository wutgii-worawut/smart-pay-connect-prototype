/**
 * src/types/leave.ts — shared type สำหรับข้อมูลใบลา (D2 plan.md §1)
 * primitive ที่ POST body / GET detail / ฟอร์ม leave (P16) ใช้ร่วมกัน — อยู่ shared เพราะ
 * component/util ที่ไม่รู้จัก feature ใด (เช่น src/utils/date.ts) ก็ต้อง import type นี้ได้
 */

/** ช่วงของวันลาในหนึ่งวัน: เต็มวัน / ครึ่งเช้า / ครึ่งบ่าย */
export type LeaveDayPeriod = 'full' | 'am' | 'pm'

/** วันลาหนึ่งรายการในฟอร์ม/คำขอ */
export interface LeaveDayEntry {
  /** วันที่ 'YYYY-MM-DD' */
  date: string
  period: LeaveDayPeriod
}

/**
 * ประเภทลา (feature-plans/00 §1 S5) — ใช้กับ LeaveTypeIcon, FilterChips ตัวเลือกประเภท,
 * LeaveBalanceCard (P14), LeaveForm (P16) ฯลฯ ประกาศที่นี่เพราะเป็น primitive ข้าม feature (D2)
 */
export type LeaveType = 'vacation' | 'sick' | 'personal'

/**
 * สถานะคำขอลา (feature-plans/00 §1 S4) — ใช้กับ StatusBadge, LeaveRequestCard/DetailCard (P14-P15),
 * ฝั่ง Approval ใช้ชุดเดียวกัน (feature-plans/00 §2 "สีและ state ชุดเดียวกัน")
 */
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

/**
 * ใบลาหนึ่งรายการที่ render ใน list (P14 — `LeaveRequestCard`, D2: shared การ์ด presentational ล้วน)
 * field เป็น "display-ready" ตั้งใจให้การ์ดไม่ต้อง derive อะไรเอง (ไม่มี useQuery/business logic ในการ์ด)
 *
 * 🔴 CONTRACT FLAG (P14): shape นี้ invented ทั้งหมด — §16.3 ระบุแค่ endpoint `GET /leave/requests`
 * ไม่มี response contract ยืนยัน (เหมือนสถานการณ์เดียวกับ P13 `AttendanceHistoryDay`) รอ probe swagger จริง
 */
export interface LeaveRequest {
  id: string
  type: LeaveType
  status: LeaveRequestStatus
  /** วันเริ่ม 'YYYY-MM-DD' */
  startDate: string
  /** วันสิ้นสุด 'YYYY-MM-DD' (=== startDate ถ้าลาวันเดียว) */
  endDate: string
  /** จำนวนวันลารวม (server คำนวณมาแล้ว เทียบเท่า sumLeaveDays ฝั่ง backend) เช่น 1, 2, 2.5 */
  totalDays: number
  /** ป้ายสรุปช่วงเวลา เช่น 'เต็มวัน' | 'ครึ่งวัน (เช้า)' | 'ผสม' — server ส่งข้อความสำเร็จรูปมา ไม่ derive เอง */
  periodSummary: string
  /** ชื่อพนักงาน — มีเฉพาะฝั่ง Approval (P19, `showEmployeeName`) ไม่มีค่าตอนดูใบลาของตัวเอง */
  employeeName?: string
}

/**
 * ไฟล์แนบของใบลา (P15 — `AttachmentItem` S10) — display-ready เช่นเดียวกับ field อื่นใน
 * `LeaveRequestDetail` (การ์ดไม่ format ขนาดไฟล์เอง)
 */
export interface LeaveAttachment {
  id: string
  name: string
  /** ขนาดไฟล์ format มาแล้วพร้อมแสดง เช่น "120 KB" */
  sizeLabel: string
  url?: string
}

/**
 * รายละเอียดใบลาเต็ม (P15 — `LeaveRequestDetailCard` mode `owner-view`, ใช้ต่อใน Approval P20 ด้วย)
 * `GET /leave/requests/{id}` — เป็น shared type เพราะการ์ดที่ใช้เป็น shared component (D2)
 *
 * 🔴 CONTRACT FLAG (P15): shape นี้ invented ทั้งหมด — §16.3 ระบุแค่ endpoint `GET /leave/requests/{id}`
 * ไม่มี response contract ยืนยัน (เหมือนสถานการณ์เดียวกับ `LeaveRequest`/`LeaveBalance` ที่ P14) รอ
 * probe swagger จริง — field ชื่อ/รูปแบบอิงจาก design `4.History Details.png` / `8. Sended Pending
 * Details.png` (เลขที่ใบลารูปแบบ "ล 0706/10" เป็นตัวอย่างจาก design ล้วน ๆ, ไม่รู้กติกาจริงของเลขรัน)
 */
export interface LeaveRequestDetail {
  id: string
  type: LeaveType
  status: LeaveRequestStatus
  /** เลขที่ใบลา เช่น "ล 0706/10" */
  requestNumber: string
  /** วันเริ่ม 'YYYY-MM-DD' */
  startDate: string
  /** วันสิ้นสุด 'YYYY-MM-DD' */
  endDate: string
  /** รายละเอียดรายวัน (period ต่อวัน) ใช้ render แถว "รายละเอียดรายวัน" */
  days: LeaveDayEntry[]
  /** จำนวนวันลารวม (server คำนวณมาแล้ว) */
  totalDays: number
  /** ป้ายสรุปช่วงเวลา เช่น 'เต็มวัน' | 'ครึ่งวัน (เช้า)' | 'ผสม' */
  periodSummary: string
  reason: string
  /** วันที่ส่งคำขอ 'YYYY-MM-DD' */
  submittedAt: string
  /** ผู้ปฏิบัติงานแทน */
  proxyName: string
  /** ผู้อนุมัติ */
  approverName: string
  /** วันที่อนุมัติ 'YYYY-MM-DD' หรือ null ถ้ายังไม่อนุมัติ */
  approvedAt: string | null
  attachments: LeaveAttachment[]
}

/**
 * โควตาวันลาต่อประเภท ต่อปี (P14 — `LeaveBalanceCard`, `GET /leave/balance?year=`)
 *
 * 🔴 CONTRACT FLAG (P14): shape นี้ invented ทั้งหมดเช่นกัน (§16.3 ระบุแค่ endpoint) — field name
 * ปรับตาม design `1.Balance.png` (ได้รับ/ยกมา/ใช้ไป/รออนุมัติ/คงเหลือ) รอ probe swagger จริง
 */
export interface LeaveBalance {
  type: LeaveType
  /** ได้รับ (โควตาปีนี้ ไม่รวมยกมา) */
  total: number
  /** ยกมาจากปีก่อน */
  carriedOver: number
  /** ใช้ไปแล้ว (อนุมัติแล้วเท่านั้น) */
  used: number
  /** อยู่ระหว่างรออนุมัติ (กันโควตาไว้ล่วงหน้า ยังไม่หักจริง) */
  pending: number
  /** คงเหลือ (โดยประมาณ — server คำนวณ ไม่ใช่ frontend derive) */
  remaining: number
}
