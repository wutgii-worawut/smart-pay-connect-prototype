/**
 * features/leave/utils/filterOptions.ts — ตัวเลือก `FilterChips`/`DropdownFilter` ของหน้า
 * รออนุมัติลา/ประวัติการลา (`2.Pending Requests.png` / `3.History.png`, P14) — pure function ล้วน
 * (ไม่แตะ `new Date()` ข้างใน — รับ `referenceYear` เป็น param กัน non-deterministic ตาม testing.md)
 *
 * ปีที่ใช้เป็น query param ยังเป็น ค.ศ. เสมอ (ตรง `LeaveRequestsParams.year`) — label แสดง พ.ศ. ผ่าน
 * `toBuddhistYear` (จุดบวก 543 เดียวกับ utils/date.ts ทั้งไฟล์) ไม่บวกเองที่นี่
 */
import { toBuddhistYear } from '@/utils/date'
import type { LeaveRequestStatus, LeaveType } from '@/types/leave'

export interface FilterOption {
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

/** ตัวเลือกประเภทลา (FilterChips) — ตรงลำดับ design "ทั้งหมด | ลาป่วย | ลาพักร้อน | ลากิจ" */
export const TYPE_FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'sick', label: 'ลาป่วย' },
  { value: 'vacation', label: 'ลาพักร้อน' },
  { value: 'personal', label: 'ลากิจ' },
]

/** ตัวเลือกสถานะ (DropdownFilter) */
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
]

/** ตัวเลือกเดือน (DropdownFilter) — "ทั้งหมด" + 12 เดือนไทย ค่า value = '1'-'12' */
export const MONTH_FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'ทั้งหมด' },
  ...THAI_MONTHS.map((label, index) => ({ value: String(index + 1), label })),
]

/**
 * ตัวเลือกปี (DropdownFilter) — "ทั้งหมด" + `span` ปีย้อนหลังจาก `referenceYear` (ค.ศ.)
 * value เป็น ค.ศ. (ตรง query param) label เป็น พ.ศ. (แสดงผู้ใช้)
 */
export function generateYearFilterOptions(referenceYear: number, span = 4): FilterOption[] {
  const options: FilterOption[] = [{ value: 'all', label: 'ทั้งหมด' }]
  for (let i = 0; i < span; i++) {
    const yearCe = referenceYear - i
    options.push({ value: String(yearCe), label: String(toBuddhistYear(yearCe)) })
  }
  return options
}

/**
 * แปลงค่า string ของ `DropdownFilter` สถานะ → `LeaveRequestStatus | undefined` (undefined = ไม่กรอง/'ทั้งหมด')
 * type guard ล้วน — เลี่ยง `as` (code-style.md ห้าม type assertion ปิด error)
 */
export function toStatusParam(value: string): LeaveRequestStatus | undefined {
  if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED' || value === 'CANCELLED') {
    return value
  }
  return undefined
}

/** แปลงค่า string ของ `FilterChips` ประเภทลา → `LeaveType | undefined` (undefined = ไม่กรอง/'ทั้งหมด') */
export function toTypeParam(value: string): LeaveType | undefined {
  if (value === 'vacation' || value === 'sick' || value === 'personal') return value
  return undefined
}
