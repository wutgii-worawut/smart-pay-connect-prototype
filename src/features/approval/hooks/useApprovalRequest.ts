/**
 * features/approval/hooks/useApprovalRequest.ts — useQuery ห่อ `GET /approval/requests/{id}` (P20)
 * `enabled` กัน fetch ตอน id ยังว่าง (มิเรอร์ `features/leave/hooks/useLeaveRequest.ts`, P15)
 */
import { useQuery } from '@tanstack/react-query'
import { getApprovalRequest } from '../api/getRequest'

export const approvalRequestQueryKey = (id: string) => ['approval', 'request', id] as const

export function useApprovalRequest(id: string) {
  return useQuery({
    queryKey: approvalRequestQueryKey(id),
    queryFn: () => getApprovalRequest(id),
    enabled: id.length > 0,
  })
}
