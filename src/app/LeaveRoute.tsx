/**
 * app/LeaveRoute.tsx — compose หน้า `/leave` (P19 — เพิ่มแท็บบนสุด "การลาของฉัน | รออนุมัติ (n)"
 * เฉพาะ manager, ทับ `LeaveShellPage` ตรง ๆ ที่ P14 เคย element ไว้)
 *
 * `LeaveApprovalTopNav` (`app/`) ต้องอ่าน `useAuthStore` (role) + `usePendingRequests` (จาก
 * `features/approval`) — สอง feature คนละตัวที่ `features/leave` ห้าม import ข้าม (กฎเหล็ก §6) จึง
 * compose ที่นี่แทน เหมือน pattern `AttendanceRoute`/`AttendanceHistoryRoute`
 *
 * ไม่มี `usePageTitle` ในไฟล์นี้ — `LeaveShellPage` เรียก `usePageTitle('บันทึกการลา')` เองอยู่แล้ว
 * (P14) ตรงกับ header ทั้งของพนักงานทั่วไปและหัวหน้า (design ไม่มีชื่อหน้าต่างกันระหว่าง 2 role)
 *
 * layout มิเรอร์ `AttendanceRoute`/`AttendanceHistoryRoute`: `h-screen flex-col` ครอบ top nav +
 * `min-h-0 flex-1` ห่อ `LeaveShellPage` (root ของ `LeaveShellPage` เองใช้ `h-full flex-col` อยู่แล้ว
 * — resolve ได้ถูกเพราะ flex item ที่มี `flex-1`+`min-h-0` ได้ definite height จาก flex layout)
 *
 * non-manager: `LeaveApprovalTopNav` คืน `null` เอง (เช็ค role ข้างในตัวมันเอง) → เหลือแค่
 * `LeaveShellPage` เต็มจอเหมือน P14 เป๊ะ ไม่ regress
 */
import { LeaveShellPage } from '@/features/leave'
import { LeaveApprovalTopNav } from './LeaveApprovalTopNav'

export function LeaveRoute() {
  return (
    <div className="flex h-screen flex-col bg-surface">
      <LeaveApprovalTopNav />
      <div className="min-h-0 flex-1">
        <LeaveShellPage />
      </div>
    </div>
  )
}
