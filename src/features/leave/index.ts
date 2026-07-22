/**
 * features/leave/index.ts — public API ของ leave feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 * export `LeaveShellPage` (P14 — จอ balance/pending/history, `/leave`)
 * export `LeaveDetailPage` (P15 — จอ detail/cancel, `/leave/:id`)
 */
export { LeaveShellPage } from './pages/LeaveShellPage'
export { LeaveDetailPage } from './pages/LeaveDetailPage'
