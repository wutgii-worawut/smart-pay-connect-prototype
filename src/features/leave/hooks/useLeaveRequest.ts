/**
 * features/leave/hooks/useLeaveRequest.ts — useQuery ห่อ `GET /leave/requests/{id}` (P15)
 * `enabled` กัน fetch ตอน id ยังว่าง (เช่น ระหว่าง route param ยังไม่พร้อม)
 */
import { useQuery } from '@tanstack/react-query'
import { getRequest } from '../api/getRequest'

export const leaveRequestQueryKey = (id: string) => ['leave', 'request', id] as const

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: leaveRequestQueryKey(id),
    queryFn: () => getRequest(id),
    enabled: id.length > 0,
  })
}
