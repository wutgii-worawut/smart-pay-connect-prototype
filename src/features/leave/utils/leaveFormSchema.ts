/**
 * features/leave/utils/leaveFormSchema.ts — Zod schema ของฟอร์มสร้างใบลา (P16, feature-plans/03 §3.6)
 * แยกออกจาก `components/LeaveForm.tsx` เพราะเป็น pure logic ล้วน (ไม่มี React) ต้องอยู่ `utils/*.ts`
 * ตาม code-style.md §7 (และ eslint react-refresh/only-export-components ก็ห้ามไฟล์ component
 * export ค่าที่ไม่ใช่ component ปนกันอยู่แล้ว — เหมือนสถานการณ์ `LeaveTypeIcon.tsx` vs `leaveType.ts`)
 *
 * เป็นด่านเข้ม (§16.3): `type`/`reason` required, `dateRange` ต้อง end>=start และช่วงไม่เกิน
 * 31 วันปฏิทิน (progress.md P1 #5.1), `days[]` ต้องครบทุกวันทำงานใน [start,end] ตาม
 * `listLeaveWorkingDays` (holidays เป็น param ปิดผนึกไว้ตอนสร้าง schema — เรียกซ้ำได้ทุกครั้งที่
 * holidays เปลี่ยน) — cross-field error ทั้งหมดผูกที่ path `dateRange` (surface เดียวที่ UI มีให้โชว์
 * ความผิดพลาดเรื่องวันที่/ช่วงเวลา ดู `LeavePeriodSection.tsx`)
 *
 * `proxyId` (RHF field name ภายใน — map ไปเป็น `substituteId` ตอนประกอบ payload ที่ `LeaveForm.tsx`)
 * **ไม่บังคับ** (ผู้ใช้เคาะ 2026-07-22 ตรงกับ `substituteId?` ใน §16.3) — เก็บเป็น `''` เมื่อไม่ได้เลือก
 * จึงไม่ validate min length ในนี้
 */
import { z } from 'zod'
import { countCalendarDays, listLeaveWorkingDays } from '@/utils/date'

export function buildLeaveFormSchema(holidays: string[]) {
  return z
    .object({
      type: z.enum(['vacation', 'sick', 'personal']).nullable(),
      dateRange: z.object({ start: z.string(), end: z.string() }).nullable(),
      days: z.array(z.object({ date: z.string(), period: z.enum(['full', 'am', 'pm']) })),
      reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลการลา'),
      attachments: z.array(z.instanceof(File)),
      proxyId: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.type === null) {
        ctx.addIssue({ code: 'custom', path: ['type'], message: 'กรุณาเลือกประเภทการลา' })
      }

      if (!values.dateRange) {
        ctx.addIssue({ code: 'custom', path: ['dateRange'], message: 'กรุณาเลือกช่วงวันที่ลา' })
        return
      }

      const { start, end } = values.dateRange
      if (end < start) {
        ctx.addIssue({ code: 'custom', path: ['dateRange'], message: 'วันสิ้นสุดต้องไม่ก่อนวันที่เริ่ม' })
        return
      }
      if (countCalendarDays(start, end) > 31) {
        ctx.addIssue({ code: 'custom', path: ['dateRange'], message: 'ช่วงวันลาต้องไม่เกิน 31 วัน' })
        return
      }

      const workingDays = listLeaveWorkingDays(start, end, holidays)
      if (workingDays.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['dateRange'],
          message: 'ช่วงวันที่เลือกไม่มีวันทำงาน กรุณาเลือกวันใหม่',
        })
        return
      }

      const dayDateSet = new Set(values.days.map((d) => d.date))
      const coversAllWorkingDays =
        values.days.length === workingDays.length && workingDays.every((d) => dayDateSet.has(d))
      if (!coversAllWorkingDays) {
        ctx.addIssue({
          code: 'custom',
          path: ['dateRange'],
          message: 'กรุณาเลือกช่วงเวลาให้ครบทุกวันทำงาน',
        })
      }
    })
}

export type LeaveFormValues = z.infer<ReturnType<typeof buildLeaveFormSchema>>
