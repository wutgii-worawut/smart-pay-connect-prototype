/**
 * features/leave/hooks/useLeaveBalance.ts — useQuery ห่อ `GET /leave/balance?year=`
 * query key แยกต่อปี — สลับปีด้วย year stepper ที่หน้า balance แล้ว refetch อัตโนมัติ
 */
import { useQuery } from '@tanstack/react-query'
import { getBalance } from '../api/getBalance'

export const leaveBalanceQueryKey = (year: number) => ['leave', 'balance', year] as const

export function useLeaveBalance(year: number) {
  return useQuery({
    queryKey: leaveBalanceQueryKey(year),
    queryFn: () => getBalance(year),
  })
}
