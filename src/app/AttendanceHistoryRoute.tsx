/**
 * app/AttendanceHistoryRoute.tsx — compose หน้า `/attendance/history` (จอ `10.History.png`,
 * feature-plans/02, P13)
 *
 * `ProfileBar` (S15, shared) ต้องใช้ชื่อพนักงานจาก `features/auth` — กฎเหล็ก §6 ห้าม
 * `features/attendance` import ข้าม feature ดังนั้น compose ตรงนี้ (`app/`) แทน เหมือน `AttendanceRoute`
 *
 * ไม่มี `React.lazy` เหมือน `AttendanceRoute` — หน้านี้ไม่มีแผนที่/maplibre-gl (dependency หนักตัวเดียว
 * ที่ต้อง code-split) จึงไม่มี bundle ที่ต้องแยก
 *
 * Employee ยังไม่มี field email ในตอนนี้ (`features/auth/types/auth.ts` มีแค่ id/name/role) —
 * ProfileBar เลยแสดงแค่ชื่อ ไม่มี subtitle/เวลาเข้า-ออกใน trailing (design มีอีเมล+สรุปเวลาเข้า-ออก —
 * contract gap เดียวกับ `AttendanceRoute`, รอเพิ่ม field)
 *
 * ⚠️ import `AttendanceHistoryPage` ตรงจากไฟล์ ไม่ผ่าน barrel `@/features/attendance`: barrel นั้น
 * export `ClockPage` ที่ `AttendanceRoute.tsx` โหลดแบบ `React.lazy` เพื่อตัด maplibre-gl (~275KB gzip)
 * ออกจาก initial bundle — ถ้าไฟล์นี้ import barrel เดียวกันแบบ static, bundler (rolldown/rollup) จะรวม
 * chunk เข้า initial bundle ทันที (เจอ `[INEFFECTIVE_DYNAMIC_IMPORT]` ตอน build) ทำให้การ lazy-load
 * เดิมเสียเปล่า หน้านี้เองไม่มี dependency หนัก จึง import ตรงไฟล์แทนได้โดยไม่ผิดกฎ ESLint
 * (`no-restricted-paths` บล็อกแค่ cross-feature/`app`→`features` ผิดทาง ไม่ได้บล็อก deep import
 * ภายใน `app` เข้า path ไฟล์จริงของ feature เดียวกัน)
 */
import { ProfileBar } from '@/components/ProfileBar'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/features/auth'
import { AttendanceHistoryPage } from '@/features/attendance/pages/AttendanceHistoryPage'

export function AttendanceHistoryRoute() {
  usePageTitle('ประวัติลงเวลา')
  const employee = useAuthStore((state) => state.employee)

  return (
    <div className="flex h-screen flex-col bg-surface">
      <ProfileBar name={employee?.name ?? ''} />
      <div className="min-h-0 flex-1">
        <AttendanceHistoryPage />
      </div>
    </div>
  )
}
