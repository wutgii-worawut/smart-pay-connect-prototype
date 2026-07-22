/**
 * features/payroll/hooks/usePayslip.ts — useQuery ห่อ `GET /payroll/payslips/{id}` (P21)
 * `enabled` กัน fetch ตอน id ยังว่าง (เช่น ระหว่าง route param ยังไม่พร้อม)
 */
import { useQuery } from '@tanstack/react-query'
import { getPayslip } from '../api/getPayslip'

export const payslipQueryKey = (id: string) => ['payroll', 'payslip', id] as const

export function usePayslip(id: string) {
  return useQuery({
    queryKey: payslipQueryKey(id),
    queryFn: () => getPayslip(id),
    enabled: id.length > 0,
  })
}
