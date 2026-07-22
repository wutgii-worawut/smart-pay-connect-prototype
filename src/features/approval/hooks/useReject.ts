/**
 * features/approval/hooks/useReject.ts — mutation ไม่อนุมัติใบลา (P20, §16.3 `POST
 * /approval/requests/{id}/reject`) `retry: 0` เสมอ (§20.4) invalidate cache เดียวกับ `useApprove`
 *
 * toast/navigate เป็นหน้าที่ของ `ApprovalDetailPage` (มิเรอร์ `useApprove`/`useCancelLeave`) — เหตุผล
 * บังคับ (`reason: string` ไม่ optional) แต่ validate ช่องว่างเป็นหน้าที่ page ก่อนเรียก `mutate`
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { rejectRequest } from '../api/reject'
import { approvalRequestQueryKey } from './useApprovalRequest'
import { pendingRequestsQueryKey } from './usePendingRequests'

export function useReject(id: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    retry: 0,
    mutationFn: (reason) => rejectRequest(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pendingRequestsQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['approval', 'history'] })
      void queryClient.invalidateQueries({ queryKey: approvalRequestQueryKey(id) })
    },
  })
}
