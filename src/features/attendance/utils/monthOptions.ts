/**
 * features/attendance/utils/monthOptions.ts — สร้างตัวเลือกเดือน/ปีให้ `DropdownFilter` ของหน้า
 * ประวัติลงเวลา (`10.History.png`) — pure function ล้วน (รับ `referenceDate` เป็น param ไม่แตะ
 * `new Date()` ข้างใน กัน non-deterministic ตาม testing.md)
 *
 * label ตัดคำ "พ.ศ. " ออกจาก `formatThaiMonthCaption` (ให้ตรง design "ตุลาคม 2568" ไม่มี "พ.ศ.") —
 * เป็นการตัด prefix ข้อความล้วน ไม่ได้บวก 543 ซ้ำที่นี่ (จุดบวก 543 จริงยังอยู่ที่เดียวคือ
 * `utils/date.ts` ตามกติกา §4.1)
 */
import { format, subMonths } from 'date-fns'
import { formatThaiMonthCaption } from '@/utils/date'

export interface MonthOption {
  /** 'YYYY-MM' — ใช้เป็น query param ของ `GET /attendance/history?month=` */
  value: string
  /** เช่น "ตุลาคม 2568" */
  label: string
}

/** คืนตัวเลือกเดือนล่าสุด `count` เดือน (ไล่จากเดือนของ `referenceDate` ย้อนหลัง) เรียงใหม่สุดก่อน */
export function generateMonthOptions(referenceDate: Date, count = 12): MonthOption[] {
  const options: MonthOption[] = []
  for (let i = 0; i < count; i++) {
    const d = subMonths(referenceDate, i)
    const { month, yearBe } = formatThaiMonthCaption(d)
    options.push({
      value: format(d, 'yyyy-MM'),
      label: `${month} ${yearBe.replace('พ.ศ. ', '')}`,
    })
  }
  return options
}
