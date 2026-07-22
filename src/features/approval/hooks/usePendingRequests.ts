/**
 * features/approval/hooks/usePendingRequests.ts — useQuery ห่อ `GET /approval/pending`
 * ใช้ทั้งรายการหลักของแท็บ "รออนุมัติ" (`ApprovalListPage`) และ badge count บนแท็บบนสุด
 * "รออนุมัติ (n)" (`app/LeaveApprovalTopNav.tsx` — app/ import feature นี้ได้ตามกฎเหล็ก §6)
 *
 * `options.enabled` (มิเรอร์ pattern `useApprovalHistory`) — **สำคัญ**: `LeaveApprovalTopNav` ต้องส่ง
 * `enabled: role === 'manager'` เสมอ เพราะ hook นี้ถูกเรียกก่อนเช็ค role (React hook rule ห้ามเรียก
 * conditional) ถ้าไม่ปิด query พนักงานทั่วไปทุกคนที่เปิด `/leave` จะยิง `GET /approval/pending`
 * ไปด้วย ทั้งที่ backend §17.3 ต้องตอบ 403/denial เสมอ — เสี่ยง logout loop ถ้า backend จริงตอบ
 * `UNAUTHORIZED` แทน `FORBIDDEN` (consultant review P19 M1)
 */
import { useQuery } from '@tanstack/react-query'
import { getPending } from '../api/getPending'

export const pendingRequestsQueryKey = ['approval', 'pending'] as const

interface UsePendingRequestsOptions {
  enabled?: boolean
}

export function usePendingRequests(options?: UsePendingRequestsOptions) {
  return useQuery({
    queryKey: pendingRequestsQueryKey,
    queryFn: getPending,
    enabled: options?.enabled ?? true,
  })
}
