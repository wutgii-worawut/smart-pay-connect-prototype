/**
 * features/payroll/hooks/useEmailPayslip.ts — mutation ส่งสลิปเข้าอีเมลที่ลงทะเบียนไว้ (P21)
 * `retry: 0` มาจาก default กลาง (`lib/query-client.ts`, §20.4) — ห้ามยิงซ้ำอัตโนมัติ (กันอีเมลซ้ำ)
 * ปุ่มเรียกใช้ (`GhostButton isPending`) เป็นคนกัน double-submit ระหว่างส่ง — hook นี้ไม่มี side effect
 * อื่นนอกจากเรียก mutationFn (toast/disabled เป็นหน้าที่ `PayslipDetailPage`)
 */
import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { emailPayslip } from '../api/emailPayslip'

export function useEmailPayslip(id: string) {
  return useMutation<void, ApiError, void>({
    mutationFn: () => emailPayslip(id),
  })
}
