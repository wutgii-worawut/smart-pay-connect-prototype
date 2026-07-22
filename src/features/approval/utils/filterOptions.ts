/**
 * features/approval/utils/filterOptions.ts — ตัวเลือก `DropdownFilter` ปี/เดือนของหน้า Approval
 * (`ApprovalListPage`, P19) — pure function ล้วน (ไม่แตะ `new Date()` ข้างใน — รับ `referenceYear`
 * เป็น param กัน non-deterministic ตาม testing.md)
 *
 * ⚠️ ไม่ import จาก `features/leave/utils/filterOptions.ts` แม้เนื้อหาคล้ายกันมาก — กฎเหล็ก §6 ห้าม
 * cross-feature import จึงต้องมีชุดของตัวเองในนี้ (ต่างจาก `LeaveShellPage` ตรงที่ `GET
 * /approval/history?year=&month=` **บังคับ** ทั้งสอง param เป็นตัวเลขเสมอ — จึงไม่มีตัวเลือก "ทั้งหมด"
 * เหมือนฝั่ง leave)
 *
 * ปีที่ใช้เป็น query param ยังเป็น ค.ศ. เสมอ label แสดง พ.ศ. ผ่าน `toBuddhistYear` (จุดบวก 543 เดียวกับ
 * utils/date.ts ทั้งไฟล์) ไม่บวกเองที่นี่
 */
import { toBuddhistYear } from '@/utils/date'

export interface ApprovalFilterOption {
  value: string
  label: string
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

/** ตัวเลือกเดือน (DropdownFilter) — 12 เดือนไทย ค่า value = '1'-'12' (ไม่มี "ทั้งหมด" — ดูคอมเมนต์หัวไฟล์) */
export const APPROVAL_MONTH_OPTIONS: ApprovalFilterOption[] = THAI_MONTHS.map((label, index) => ({
  value: String(index + 1),
  label,
}))

/**
 * ตัวเลือกปี (DropdownFilter) — `span` ปีย้อนหลังจาก `referenceYear` (ค.ศ., ไม่มี "ทั้งหมด")
 * value เป็น ค.ศ. (ตรง query param) label เป็น พ.ศ. (แสดงผู้ใช้)
 */
export function generateApprovalYearOptions(referenceYear: number, span = 4): ApprovalFilterOption[] {
  const options: ApprovalFilterOption[] = []
  for (let i = 0; i < span; i++) {
    const yearCe = referenceYear - i
    options.push({ value: String(yearCe), label: String(toBuddhistYear(yearCe)) })
  }
  return options
}
