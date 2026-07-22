/**
 * features/payroll/hooks/usePayslips.ts — useQuery ห่อ `GET /payroll/payslips?year=` (P21)
 * query key แยกต่อปี — สลับปีด้วย DropdownFilter แล้ว refetch อัตโนมัติ
 */
import { useQuery } from '@tanstack/react-query'
import { getPayslips } from '../api/getPayslips'

export const payslipsQueryKey = (year: number) => ['payroll', 'payslips', year] as const

export function usePayslips(year: number) {
  return useQuery({
    queryKey: payslipsQueryKey(year),
    queryFn: () => getPayslips(year),
  })
}
