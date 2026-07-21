/**
 * features/attendance/types/attendance.ts — primitive ของ ClockPage state machine (§16.3, feature-plans/02)
 *
 * ⚠️ CONTRACT FLAGS (เพิ่มจาก P11 shape เดิม — รอ backend/swagger ยืนยัน):
 * - `office.name`/`office.address` — P11 ของเดิมมีแค่ lat/lng/radiusMeters ไม่มีชื่อ/ที่อยู่สถานที่
 *   ทำงาน ต้องเพิ่มเพื่อแสดงในไทม์ไลน์ผลลัพธ์ลงเวลา (จอ 2/4/7/9) — `address` โชว์เฉพาะรายการ
 *   remote ตาม design (onsite ไม่โชว์ที่อยู่เต็ม)
 * - `canRemoteClock` — feature-plans/02 สั่งเผื่อ flag นี้ (เปิด/ปิดโหมด remote ต่อพนักงาน) แต่ P11
 *   mock ยังไม่ใส่ (ดู plan/progress.md บันทึกแก้แผน P11 ข้อ 3)
 * - `date` — เพิ่มใหม่ (server เป็นคนกำหนดว่า "วันนี้" คือวันไหน กัน client ใช้ `new Date()` เอง
 *   ตาม §15 "client clock untrusted") ใช้แสดงผลในจอสำเร็จเท่านั้น ไม่ใช้ตัดสิน logic ใด ๆ
 */

export type ClockType = 'onsite' | 'remote'

export interface AttendanceOffice {
  lat: number
  lng: number
  radiusMeters: number
  /** ชื่อสถานที่ทำงาน — แสดงในไทม์ไลน์ผลลัพธ์ลงเวลา */
  name: string
  /** ที่อยู่แบบเต็ม — โชว์เฉพาะรายการที่ลงเวลานอกสถานที่ (remote) ตาม design จอ 7/9 */
  address?: string
}

export interface AttendanceToday {
  clockedIn: boolean
  clockedOut: boolean
  /** เวลาที่ลงชื่อเข้า — string "HH:mm" จัดรูปแบบจาก server แล้ว (ไม่ใช่ instant, ตาม P11 shape เดิม) */
  clockInTime: string | null
  clockOutTime: string | null
  /** ประเภทตอนลงเวลาเข้า — ใช้ประเภทเดียวกันตอนลงเวลาออกด้วย (session เดียวกัน) */
  clockInType: ClockType | null
  office: AttendanceOffice
  /** เปิด/ปิดโหมดลงเวลานอกสถานที่ต่อพนักงาน (open question §23.1#4) */
  canRemoteClock: boolean
  /** วันนี้ตามเซิร์ฟเวอร์ 'YYYY-MM-DD' — ใช้แสดงผลผ่าน formatThaiDate เท่านั้น (§15 client clock untrusted) */
  date: string
}

/** payload ของทั้ง clock-in และ clock-out (§16.3 "โครงเดียวกับ clock-in") */
export interface ClockRequestPayload {
  lat: number
  lng: number
  accuracy: number
  type: ClockType
  remoteReason?: string
}

/** server ประทับเวลา+วันที่เอง (§15) — client ไม่ส่ง/ไม่คำนวณเวลาเอง */
export interface ClockResponse {
  /** 'YYYY-MM-DD' */
  date: string
  /** "HH:mm" */
  time: string
  type: ClockType
}
