/**
 * features/payroll/api/getPayslips.ts — GET /payroll/payslips?year= (§16.3, feature-plans/05, P21)
 * schema ไม่ strict — ตัด field แปลกที่ backend เผลอส่งมาทิ้งอัตโนมัติ ไม่ throw (เหมือน leave/attendance)
 * ดู CONTRACT FLAG ที่ types/payslip.ts — response shape ยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { Payslip } from '../types/payslip'

const payslipSchema = z.object({
  id: z.string(),
  periodLabel: z.string(),
  netPay: z.number(),
  payDate: z.iso.date(),
  status: z.enum(['released', 'processing']),
})

/** @param year ปี ค.ศ. */
export async function getPayslips(year: number): Promise<Payslip[]> {
  const data = await api.get<unknown>('/payroll/payslips', { params: { year } })
  return z.array(payslipSchema).parse(data)
}
