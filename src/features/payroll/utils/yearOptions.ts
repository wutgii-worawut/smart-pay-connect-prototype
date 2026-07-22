/**
 * features/payroll/utils/yearOptions.ts — pure function สร้างตัวเลือกปีให้ `DropdownFilter` ปี (จอ 5.1)
 * label เป็น พ.ศ. (ผ่าน `toBuddhistYear`, จุดบวก 543 เดียวกับทั้งระบบ) value เป็นปี ค.ศ. ล้วน (ตรง
 * query param `year` ของ `GET /payroll/payslips?year=`)
 */
import { toBuddhistYear } from '@/utils/date'

export interface PayslipYearOption {
  value: string
  label: string
}

/** คืนตัวเลือกปีปัจจุบันย้อนหลัง `count` ปี (รวมปีปัจจุบัน) เรียงใหม่→เก่า */
export function generatePayslipYearOptions(currentYear: number, count = 3): PayslipYearOption[] {
  return Array.from({ length: count }, (_, i) => currentYear - i).map((year) => ({
    value: String(year),
    label: String(toBuddhistYear(year)),
  }))
}
