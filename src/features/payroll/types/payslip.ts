/**
 * features/payroll/types/payslip.ts — primitive ของ payroll feature (§16.3, feature-plans/05, P21)
 *
 * 🔴 CONTRACT FLAG (invented ทั้งชุด — feature-plans/05 ระบุแค่ endpoint ไม่มี response shape ยืนยัน
 * เหมือนสถานการณ์ P13/P14/P15 — ยังไม่ได้ probe กับ mock service จริง):
 * - `Payslip` (list item) + `PayslipDetail` shape เดาจาก design `5.Payroll/1.Payslip History.png` /
 *   `2.Payslip Details.png` / `2.1.Payslip Details (fullscreen).png`
 * - รายรับ/รายหักเป็น array `{label, amount}` ตามหมายเหตุ feature-plans/05 (ไม่ hardcode ชื่อรายการ) —
 *   backend เป็นผู้กำหนดรายการจริง
 */

/** 'released' = ออกแล้ว (มีสลิปให้ดู) / 'processing' = กำลังประมวลผล ("ยังไม่ออก") */
export type PayslipStatus = 'released' | 'processing'

/** แถวเดียวในรายการ "ประวัติสลิปเงินเดือน" (จอ 5.1) */
export interface Payslip {
  id: string
  /** ป้ายงวดจาก backend ตรง ๆ เช่น "มิถุนายน 2569" — ไม่ผ่าน formatThaiDate (ไม่ใช่ 'YYYY-MM-DD') */
  periodLabel: string
  netPay: number
  /** วันจ่ายเงินเดือน 'YYYY-MM-DD' — แสดงผลผ่าน formatThaiDate เท่านั้น */
  payDate: string
  status: PayslipStatus
}

/** แถวเดียวของรายรับ/รายหัก — มาจาก API เป็น array ไม่ hardcode ชื่อรายการ (feature-plans/05 หมายเหตุ) */
export interface PayslipLineItem {
  label: string
  amount: number
}

export interface PayslipEmployeeInfo {
  code: string
  name: string
  position: string
  department: string
  /** วันเข้าทำงาน — design แสดง "01/01/2560" (ตัวอย่างจริงเป็น ค.ศ.+พ.ศ. ปนกันในรูป) ดังนั้นรับเป็น
   * display string ตรง ๆ จาก backend ไม่ parse/format เอง (ต่างจาก payDate ที่เป็น 'YYYY-MM-DD' จริง) */
  startDate: string
}

/** รายละเอียดสลิปเต็ม (จอ 5.2/5.3) */
export interface PayslipDetail {
  id: string
  periodLabel: string
  netPay: number
  payDate: string
  /** เช่น "งวดที่ 1" — ต่อท้าย chip "เงินเดือนออก {payDate} {periodRound}" */
  periodRound: string
  employee: PayslipEmployeeInfo
  earnings: PayslipLineItem[]
  deductions: PayslipLineItem[]
}
