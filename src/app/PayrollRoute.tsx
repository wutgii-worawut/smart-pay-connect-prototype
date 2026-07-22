/**
 * app/PayrollRoute.tsx — compose หน้า `/payroll` (จอ `1.Payslip History.png`, feature-plans/05, P21)
 *
 * `ProfileBar` (S15, shared) ต้องใช้ชื่อพนักงานจาก `features/auth` — กฎเหล็ก §6 ห้าม `features/payroll`
 * import ข้าม feature ดังนั้น compose ตรงนี้ (`app/`) แทน มิเรอร์ `app/AttendanceRoute.tsx`
 *
 * Employee ยังไม่มี field email ในตอนนี้ (`features/auth/types/auth.ts` มีแค่ id/name/role) —
 * ProfileBar เลยแสดงแค่ชื่อ ไม่มี subtitle (design มีอีเมลใต้ชื่อ — contract gap เดียวกับ
 * AttendanceRoute/AttendanceHistoryRoute, รอเพิ่ม field) kebab ⋮ (`trailing`) ก็ไม่ทำเหตุผลเดียวกัน —
 * ไม่มีเมนูที่ระบุไว้ใน spec ของเฟสนี้
 */
import { ProfileBar } from '@/components/ProfileBar'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/features/auth'
import { PayslipListPage } from '@/features/payroll'

export function PayrollRoute() {
  usePageTitle('ดูสลิปเงินเดือน')
  const employee = useAuthStore((state) => state.employee)

  return (
    <div className="flex h-screen flex-col bg-surface">
      <ProfileBar name={employee?.name ?? ''} />
      <div className="min-h-0 flex-1">
        <PayslipListPage />
      </div>
    </div>
  )
}
