/**
 * features/leave/hooks/useTeammates.ts — useQuery ห่อ `GET /employees/teammates` (P16)
 * ใช้ทั้งตัวเลือก "ผู้ปฏิบัติงานแทน" (Select) และชื่อ "ผู้อนุมัติ" (read-only) ในฟอร์มสร้างใบลา
 */
import { useQuery } from '@tanstack/react-query'
import { getTeammates } from '../api/getTeammates'

export const teammatesQueryKey = ['leave', 'teammates'] as const

export function useTeammates() {
  return useQuery({
    queryKey: teammatesQueryKey,
    queryFn: getTeammates,
  })
}
