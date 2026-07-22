/**
 * features/leave/hooks/useLeaveRequests.ts — useQuery ห่อ `GET /leave/requests`
 * query key รวม params ทั้งก้อน (TanStack Query hash key แบบ deep — object เดิม content เดิม = key เดิม)
 * ใช้ทั้งรายการหลักของหน้า (pending/history ตาม filter) และ query เล็กแยกต่างหากสำหรับนับ badge
 * "ใบลารออนุมัติ" บนแถบล่าง (`LeaveShellPage` เรียกซ้ำสองจุดด้วย params ต่างกัน)
 */
import { useQuery } from '@tanstack/react-query'
import { getRequests, type LeaveRequestsParams } from '../api/getRequests'

export const leaveRequestsQueryKey = (params: LeaveRequestsParams) =>
  ['leave', 'requests', params] as const

interface UseLeaveRequestsOptions {
  enabled?: boolean
}

export function useLeaveRequests(params: LeaveRequestsParams, options?: UseLeaveRequestsOptions) {
  return useQuery({
    queryKey: leaveRequestsQueryKey(params),
    queryFn: () => getRequests(params),
    enabled: options?.enabled ?? true,
  })
}
