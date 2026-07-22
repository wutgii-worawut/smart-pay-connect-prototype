/**
 * features/approval/hooks/useApprovalHistory.ts — useQuery ห่อ `GET /approval/history?year=&month=`
 * query key แยกต่อปี/เดือน — สลับ `DropdownFilter` ปี/เดือนใน `ApprovalListPage` แล้ว refetch อัตโนมัติ
 */
import { useQuery } from '@tanstack/react-query'
import { getHistory } from '../api/getHistory'

export const approvalHistoryQueryKey = (year: number, month: number) =>
  ['approval', 'history', year, month] as const

interface UseApprovalHistoryOptions {
  enabled?: boolean
}

export function useApprovalHistory(year: number, month: number, options?: UseApprovalHistoryOptions) {
  return useQuery({
    queryKey: approvalHistoryQueryKey(year, month),
    queryFn: () => getHistory(year, month),
    enabled: options?.enabled ?? true,
  })
}
