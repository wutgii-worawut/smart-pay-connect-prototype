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
