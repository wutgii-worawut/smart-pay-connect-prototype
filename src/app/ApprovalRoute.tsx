/**
 * app/ApprovalRoute.tsx — compose หน้า `/approval` (P19, จอ `4.Leave Approval/1.Pending List.png`/
 * `4.History.png`) — `usePageTitle` อยู่ที่นี่ (ตรง PNG header "บันทึกการลา" เดียวกับ `/leave` เพราะ
 * design ไม่แยกชื่อหน้าตาม role) ต่างจาก `LeaveRoute` ที่ปล่อยให้ `LeaveShellPage` (feature `leave`)
 * ตั้งชื่อเอง — ที่นี่ต้องตั้งเองเพราะ `ApprovalListPage` (feature `approval`) ไม่รู้จัก title ของ route นี้
 *
 * `ManagerBanner` ใน `ApprovalListPage` ต้องใช้ชื่อพนักงานจาก `features/auth` — กฎเหล็ก §6 ห้าม
 * `features/approval` import ข้าม feature จึงอ่าน `useAuthStore` ที่นี่แล้วส่งเป็น prop
 * `managerName` แทน (pattern เดียวกับ `AttendanceRoute` ที่ส่งชื่อให้ `ProfileBar`)
 *
 * route นี้อยู่ใต้ `ProtectedRoute requireRole="manager"` แล้วใน `router.tsx` (defense-in-depth ชั้น
 * UI — backend 403 คือตัวจริง §17.3) จึงไม่เช็ค role ซ้ำในไฟล์นี้อีก
 */
import { ApprovalListPage } from '@/features/approval'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/features/auth'
import { LeaveApprovalTopNav } from './LeaveApprovalTopNav'

export function ApprovalRoute() {
  usePageTitle('บันทึกการลา')
  const employee = useAuthStore((state) => state.employee)

  return (
    <div className="flex h-screen flex-col bg-surface">
      <LeaveApprovalTopNav />
      <ApprovalListPage managerName={employee?.name ?? ''} />
    </div>
  )
}
