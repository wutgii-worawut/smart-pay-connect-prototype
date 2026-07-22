/**
 * features/calendar/types/leaveCalendar.ts — type ของจอ 6.1 Leave Calendar (P18, feature-plans/06
 * §6.1, architecture §10.3) — สองชั้นข้อมูลตาม case study: ชั้นปฏิทิน (จุดสีตามประเภท ไม่มีชื่อคน)
 * กับชั้นรายละเอียด (กดวัน → รายชื่อ) แยก endpoint กันเพราะ PDPA (§10.3 "เรื่องสิทธิ์")
 *
 * 🔴 CONTRACT FLAG (P18): ทั้งสอง shape ด้านล่าง invented จาก demo jsx ใน architecture §10.3 ตรง ๆ —
 * §16.3 ไม่ได้ระบุ response contract ของ `/leave/calendar` ไว้ (เหมือนสถานการณ์เดียวกับ P13/P14/P15)
 * รอ probe swagger จริง — โดยเฉพาะ `period` เป็น "display string สำเร็จรูป" (เช่น "เต็มวัน"/"ครึ่งเช้า")
 * ที่สมมติว่า backend ส่งมาแบบเดียวกับ `periodSummary` ใน `LeaveRequest` (ไม่ derive จาก enum เอง)
 *
 * ⚠️ ชื่อ `LeaveCalendarDay` ซ้ำกับ interface ใน `src/utils/date.ts` (ใช้กับฟอร์มสร้างใบลา P16 —
 * shape `{date, isWorkingDay}` คนละความหมายกับที่นี่ `{date, types}`) เป็นคนละไฟล์/คนละ namespace จึงไม่ชน
 * กันจริง (import แยกไฟล์เสมอ ไม่มีจุดไหน import ทั้งสองชื่อพร้อมกัน) แต่เป็นชื่อที่สับสนได้ — รายงานให้
 * consultant ทราบเผื่อพิจารณาเปลี่ยนชื่อฝั่งใดฝั่งหนึ่งภายหลัง (ตั้งชื่อตามที่ spec ของ P18 ระบุไว้ตรง ๆ)
 */
import type { LeaveType } from '@/types/leave'

/** จุดต่อวันของ "ชั้นปฏิทิน" — `GET /leave/calendar?month=` (ประเภทที่มีในวันนั้น ไม่มีชื่อคน) */
export interface LeaveCalendarDay {
  /** วันที่ 'YYYY-MM-DD' */
  date: string
  types: LeaveType[]
}

/** แถวเดียวของ "ชั้นรายละเอียด" — `GET /leave/calendar/{date}` (กรอง role/PDPA ฝั่ง backend, §10.3) */
export interface LeaveDayDetailEntry {
  employeeName: string
  type: LeaveType
  /** ช่วงเวลาแบบ display string สำเร็จรูปจาก backend เช่น "เต็มวัน" / "ครึ่งเช้า" */
  period: string
}

/** map วันที่ -> ประเภทลาของวันนั้น (ประกอบจาก `LeaveCalendarDay[]` ผ่าน `buildLeaveMap`) ใช้กับ DayButton */
export type LeaveMap = Record<string, LeaveType[]>
