/**
 * app/AttendanceHistoryRoute.tsx — compose หน้า `/attendance/history` (จอ `10.History.png`,
 * feature-plans/02, P13)
 *
 * ไม่มี `React.lazy` เหมือน `AttendanceRoute` — หน้านี้ไม่มีแผนที่/maplibre-gl (dependency หนักตัวเดียว
 * ที่ต้อง code-split) จึงไม่มี bundle ที่ต้องแยก
 *
 * [2026-07-24] เอา ProfileBar (tab user info) ออกตามที่ผู้ใช้สั่ง (เหมือน `AttendanceRoute` 2026-07-23)
 * และปรับพื้นหลังจอเป็นขาว (`bg-white`) override `--color-surface` ฟ้าอ่อนของ body ตาม `10.History.png`
 *
 * ⚠️ import `AttendanceHistoryPage` ตรงจากไฟล์ ไม่ผ่าน barrel `@/features/attendance`: barrel นั้น
 * export `ClockPage` ที่ `AttendanceRoute.tsx` โหลดแบบ `React.lazy` เพื่อตัด maplibre-gl (~275KB gzip)
 * ออกจาก initial bundle — ถ้าไฟล์นี้ import barrel เดียวกันแบบ static, bundler (rolldown/rollup) จะรวม
 * chunk เข้า initial bundle ทันที (เจอ `[INEFFECTIVE_DYNAMIC_IMPORT]` ตอน build) ทำให้การ lazy-load
 * เดิมเสียเปล่า หน้านี้เองไม่มี dependency หนัก จึง import ตรงไฟล์แทนได้โดยไม่ผิดกฎ ESLint
 * (`no-restricted-paths` บล็อกแค่ cross-feature/`app`→`features` ผิดทาง ไม่ได้บล็อก deep import
 * ภายใน `app` เข้า path ไฟล์จริงของ feature เดียวกัน)
 */
import { usePageTitle } from '@/hooks/usePageTitle'
import { AttendanceHistoryPage } from '@/features/attendance/pages/AttendanceHistoryPage'

export function AttendanceHistoryRoute() {
  usePageTitle('ประวัติลงเวลา')

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="min-h-0 flex-1">
        <AttendanceHistoryPage />
      </div>
    </div>
  )
}
