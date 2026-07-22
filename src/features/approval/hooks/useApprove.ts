/**
 * features/approval/hooks/useApprove.ts — mutation อนุมัติใบลา (P20, §16.3 `POST
 * /approval/requests/{id}/approve`) `retry: 0` เสมอ (§20.4 — ห้ามยิงอนุมัติซ้ำอัตโนมัติตอนเน็ต
 * กำกวม กันตัดโควตาซ้ำ) invalidate cache ที่เกี่ยวข้องหลังสำเร็จ: `approval/pending` (badge/list ลด),
 * `approval/history` (ใบใหม่โผล่), `approval/request/{id}` (เผื่อ refetch ซ้ำ)
 *
 * toast/navigate เป็นหน้าที่ของ `ApprovalDetailPage` (มิเรอร์แพทเทิร์น `useCancelLeave` + `LeaveDetailPage`
 * P15: hook มินิมอลคุมแค่ cache, page ตัดสิน UX ผ่าน `mutate(_, {onSuccess, onError})` ต่อครั้ง)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { approveRequest } from '../api/approve'
import { approvalRequestQueryKey } from './useApprovalRequest'
import { pendingRequestsQueryKey } from './usePendingRequests'

export function useApprove(id: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string | undefined>({
    retry: 0,
    mutationFn: (comment) => approveRequest(id, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pendingRequestsQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['approval', 'history'] })
      void queryClient.invalidateQueries({ queryKey: approvalRequestQueryKey(id) })
    },
  })
}
