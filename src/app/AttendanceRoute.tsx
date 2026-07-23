/**
 * app/AttendanceRoute.tsx — compose หน้า `/attendance` (จอ 0-9, feature-plans/02, P12)
 *
 * `React.lazy` ห่อเฉพาะ `ClockPage` (ผ่าน dynamic import ของ barrel `@/features/attendance`) เพื่อ
 * แยก `maplibre-gl` (~275KB gzip, ใช้ใน MapView) ออกจาก initial bundle — ไฟล์นี้เอง (wrapper) เบา
 * ไม่มี dependency หนัก จึงไม่ต้อง lazy
 *
 * [2026-07-23] เอา ProfileBar (tab user) ออกตามที่ผู้ใช้สั่ง — แผนที่เต็มจอถึงใต้ LIFF header
 * (มุมบนซ้าย/ขวาของแผนที่ square ตาม design — ถอด rounded-card ที่ MapView แล้ว)
 */
import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/Spinner'
import { usePageTitle } from '@/hooks/usePageTitle'

const ClockPage = lazy(() =>
  import('@/features/attendance').then((module) => ({ default: module.ClockPage })),
)

export function AttendanceRoute() {
  usePageTitle('ลงเวลาทำงาน')

  return (
    <div className="h-screen bg-surface">
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
  )
}
