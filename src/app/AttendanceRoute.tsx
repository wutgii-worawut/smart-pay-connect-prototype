/**
 * app/AttendanceRoute.tsx — compose หน้า `/attendance` (จอ 0-9, feature-plans/02, P12)
 *
 * `ProfileBar` (S15, shared) ต้องใช้ชื่อพนักงานจาก `features/auth` — กฎเหล็ก §6 ห้าม
 * `features/attendance` import ข้าม feature ดังนั้น compose ตรงนี้ (`app/`) แทน (rule "compose ที่
 * app/ หรือ page level") `ClockPage` เองจึงไม่รู้จัก auth feature เลย
 *
 * `React.lazy` ห่อเฉพาะ `ClockPage` (ผ่าน dynamic import ของ barrel `@/features/attendance`) เพื่อ
 * แยก `maplibre-gl` (~275KB gzip, ใช้ใน MapView) ออกจาก initial bundle — ไฟล์นี้เอง (wrapper) เบา
 * ไม่มี dependency หนัก จึงไม่ต้อง lazy
 *
 * Employee ยังไม่มี field email ในตอนนี้ (`features/auth/types/auth.ts` มีแค่ id/name/role) —
 * ProfileBar เลยแสดงแค่ชื่อ ไม่มี subtitle (design มีอีเมลใต้ชื่อ — contract gap รอเพิ่ม field)
 */
import { lazy, Suspense } from 'react'
import { ProfileBar } from '@/components/ProfileBar'
import { Spinner } from '@/components/Spinner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/features/auth'

const ClockPage = lazy(() =>
  import('@/features/attendance').then((module) => ({ default: module.ClockPage })),
)

export function AttendanceRoute() {
  usePageTitle('ลงเวลาทำงาน')
  const employee = useAuthStore((state) => state.employee)

  return (
    <div className="flex h-screen flex-col bg-surface">
      <ProfileBar name={employee?.name ?? ''} />
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner className="border-primary h-8 w-8" />
            </div>
          }
        >
          <ClockPage />
        </Suspense>
      </div>
    </div>
  )
}
