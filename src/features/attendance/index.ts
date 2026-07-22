/**
 * features/attendance/index.ts — public API ของ attendance feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `ClockPage` — `app/AttendanceRoute.tsx` ใช้ dynamic import ตัวนี้เพื่อ code-split
 * maplibre-gl (~275KB gzip, P11 trap) ออกจาก initial bundle ผ่าน `React.lazy`
 * export `AttendanceHistoryPage` (P13, จอ 10.History) — ไม่มี dependency หนักแบบ maplibre จึงไม่ต้อง lazy
 */
export { ClockPage } from './pages/ClockPage'
export { AttendanceHistoryPage } from './pages/AttendanceHistoryPage'
