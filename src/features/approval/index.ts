/**
 * features/approval/index.ts — public API ของ approval feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `ApprovalListPage` (P19 — จอ pending/history, `/approval` compose ที่ `app/ApprovalRoute.tsx`)
 * export `ApprovalDetailPage` (P20 — จอ detail + อนุมัติ/ไม่อนุมัติ, `/approval/:id` ต่อตรงใน `router.tsx`
 * ครอบด้วย `ProtectedRoute requireRole="manager"` มิเรอร์ `/approval`)
 * export `usePendingRequests` (ให้ `app/LeaveApprovalTopNav.tsx` ใช้คำนวณ badge count — app/ import
 * feature ได้ตามกฎเหล็ก §6)
 */
export { ApprovalListPage } from './pages/ApprovalListPage'
export { ApprovalDetailPage } from './pages/ApprovalDetailPage'
export { usePendingRequests } from './hooks/usePendingRequests'
