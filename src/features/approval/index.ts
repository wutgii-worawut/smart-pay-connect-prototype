/**
 * features/approval/index.ts — public API ของ approval feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `ApprovalListPage` (P19 — จอ pending/history, `/approval` compose ที่ `app/ApprovalRoute.tsx`)
 * export `usePendingRequests` (ให้ `app/LeaveApprovalTopNav.tsx` ใช้คำนวณ badge count — app/ import
 * feature ได้ตามกฎเหล็ก §6)
 *
 * **[P22 code-split]** `ApprovalDetailPage` (P20, `/approval/:id`) **ไม่ export ที่นี่แล้ว** —
 * `app/router.tsx` เปลี่ยนไป deep-import ตรงไฟล์ผ่าน route `lazy` ตัด vaul/Radix ออกจาก initial
 * bundle เดิม export ผ่านบาร์เรลนี้ชนกับ static import ของ `ApprovalListPage`/`usePendingRequests`
 * ในไฟล์เดียวกัน (`ApprovalRoute.tsx`/`LeaveApprovalTopNav.tsx`) ทำให้ dynamic import "ไม่มีผล"
 * (`INEFFECTIVE_DYNAMIC_IMPORT` — กับดักเดียวกับ P13 #5) ต้องการใช้หน้านี้ที่ไหน → import ตรง
 * `@/features/approval/pages/ApprovalDetailPage` เท่านั้น
 */
export { ApprovalListPage } from './pages/ApprovalListPage'
export { usePendingRequests } from './hooks/usePendingRequests'
