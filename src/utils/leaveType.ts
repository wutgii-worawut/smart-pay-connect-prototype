/**
 * src/utils/leaveType.ts — ชื่อประเภทลาไทย (ค่าคงที่ล้วน ไม่มี React) แยกออกจาก `LeaveTypeIcon.tsx`
 * เพราะ react-refresh/only-export-components ห้าม export ค่าที่ไม่ใช่ component คู่กับ component
 * ในไฟล์เดียวกัน (ไฟล์ component ต้อง export component อย่างเดียว — fast refresh boundary)
 *
 * ⚠️ [กับดักจาก P5 + CONTRACT FLAG] เดิมตั้งใจให้ label เป็น "แค่ alt fallback" (ชื่อจริงควรมาจาก
 * `GET /leave/types`). endpoint นั้น **มีในสัญญาแล้ว** (architecture §16.3 — "ประเภทลา + กติกา, cache
 * ยาวได้") แต่ยังไม่มีใน mock service / ยังไม่ probe shape จริง จึงยังไม่ต่อในเฟสนี้ —
 * **ใช้ map นี้เป็นแหล่งชื่อ interim จนถึง P16** (ฟอร์มสร้างใบลาต้องใช้ประเภท+กติกาจาก `GET /leave/types`
 * อยู่แล้ว → ต่อ endpoint จริงที่นั่น แล้วรวมให้ map นี้เป็นแค่ fallback ตามเดิม ไม่ให้ 2 แหล่ง diverge).
 * ดู feature-plans/00 §1 S5, plan/progress.md บันทึกแก้แผน P5 ข้อ 3 + P14
 */
import type { LeaveType } from '@/types/leave'

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  vacation: 'ลาพักร้อน',
  sick: 'ลาป่วย',
  personal: 'ลากิจ',
}
