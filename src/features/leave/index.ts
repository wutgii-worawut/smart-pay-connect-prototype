/**
 * features/leave/index.ts — public API ของ leave feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `LeaveShellPage` (P14 — จอ balance/pending/history, `/leave`)
 * export `LeaveDetailPage` (P15 — จอ detail/cancel, `/leave/:id`)
 * export `LeaveFormPage` (P16 — จอ 6.1/6.2 → 7 สร้างใบลา, `/leave/new`)
 */
export { LeaveShellPage } from './pages/LeaveShellPage'
export { LeaveDetailPage } from './pages/LeaveDetailPage'
export { LeaveFormPage } from './pages/LeaveFormPage'
