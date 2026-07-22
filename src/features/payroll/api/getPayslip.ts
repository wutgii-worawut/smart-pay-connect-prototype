/**
 * features/payroll/api/getPayslip.ts — GET /payroll/payslips/{id} (§16.3, feature-plans/05, P21)
 * backend เขียน audit `PAYSLIP_VIEW` ทุกครั้งที่เปิดดู (เข้มเรื่องสิทธิ์ — ฝั่ง frontend ไม่ต้องทำอะไรเพิ่ม
 * แค่เรียก endpoint นี้จริง ตัวตนอ่านจาก JWT ที่แนบไปแล้ว)
 * ดู CONTRACT FLAG ที่ types/payslip.ts — response shape ยังไม่ได้ probe กับ mock service จริง
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { PayslipDetail } from '../types/payslip'

const payslipLineItemSchema = z.object({
  label: z.string(),
  amount: z.number(),
})

const payslipDetailSchema = z.object({
  id: z.string(),
  periodLabel: z.string(),
  netPay: z.number(),
  payDate: z.iso.date(),
  periodRound: z.string(),
  employee: z.object({
    code: z.string(),
    name: z.string(),
    position: z.string(),
    department: z.string(),
    startDate: z.string(),
  }),
  earnings: z.array(payslipLineItemSchema),
  deductions: z.array(payslipLineItemSchema),
})

export async function getPayslip(id: string): Promise<PayslipDetail> {
  const data = await api.get<unknown>(`/payroll/payslips/${id}`)
  return payslipDetailSchema.parse(data)
}
