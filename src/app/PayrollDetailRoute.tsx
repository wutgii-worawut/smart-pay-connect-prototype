/**
 * app/PayrollDetailRoute.tsx — compose หน้า `/payroll/:id` (จอ `2.Payslip Details.png` /
 * `3.Email Payslip - Success.png`, feature-plans/05, P21) — มิเรอร์ `PayrollRoute`/`AttendanceRoute`
 *
 * Employee ยังไม่มี field email — ProfileBar แสดงแค่ชื่อ (contract gap เดียวกับ `PayrollRoute`)
 */
import { ProfileBar } from '@/components/ProfileBar'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/features/auth'
import { PayslipDetailPage } from '@/features/payroll'

export function PayrollDetailRoute() {
  usePageTitle('รายละเอียดสลิปเงินเดือน')
  const employee = useAuthStore((state) => state.employee)

  return (
    <div className="flex h-screen flex-col bg-surface">
      <ProfileBar name={employee?.name ?? ''} />
      <div className="min-h-0 flex-1">
        <PayslipDetailPage />
      </div>
    </div>
  )
}
