/**
 * features/leave/index.ts — public API ของ leave feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `LeaveShellPage` (P14 — จอ balance/pending/history, `/leave` ผ่าน `app/LeaveRoute.tsx`)
 *
 * **[P22 code-split]** `LeaveDetailPage` (P15, `/leave/:id`) และ `LeaveFormPage` (P16, `/leave/new`)
 * **ไม่ export ที่นี่แล้ว** — `app/router.tsx` เปลี่ยนไป deep-import ตรงไฟล์ผ่าน route `lazy` เพื่อตัด
 * vaul/Radix/react-day-picker ออกจาก initial bundle ถ้า export ผ่าน barrel นี้อยู่ dynamic import จะ
 * "ไม่มีผล" ทันที (`INEFFECTIVE_DYNAMIC_IMPORT` — บาร์เรลไฟล์เดียวที่ถูก `LeaveRoute` import แบบ
 * static จะดึงทุก static import ในไฟล์บาร์เรลเข้า initial bundle เสมอ ไม่ว่า named export ไหนถูกใช้
 * จริง — กับดักเดียวกับ P13 #5). ต้องการใช้หน้าเหล่านี้ที่ไหน → import ตรง
 * `@/features/leave/pages/LeaveDetailPage` / `.../LeaveFormPage` เท่านั้น (เทสต์ก็ทำแบบนี้อยู่แล้ว)
 */
export { LeaveShellPage } from './pages/LeaveShellPage'
