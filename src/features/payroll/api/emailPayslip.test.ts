/**
 * features/payroll/api/emailPayslip.test.ts — ยืนยันกับดัก P2 #5ข: endpoint ตอบ 204 body ว่าง
 * ต้องไม่ throw error ดิบ (TypeError จาก interceptor แกะ envelope) — ดูคอมเมนต์ในไฟล์เดียวกัน
 */
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { payrollHandlers, setEmailPayslipScenario, resetPayrollScenarios } from '@/mocks/handlers/payroll'
import { emailPayslip } from './emailPayslip'

const server = setupServer(...payrollHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetPayrollScenarios()
})
afterAll(() => server.close())

describe('emailPayslip', () => {
  it('สำเร็จแม้ backend ตอบ 204 body ว่าง (ไม่ throw)', async () => {
    await expect(emailPayslip('payslip-2026-06')).resolves.toBeUndefined()
  })

  it('error path: backend ตอบ error envelope → ApiError', async () => {
    setEmailPayslipScenario('error')
    await expect(emailPayslip('payslip-2026-06')).rejects.toMatchObject({
      code: 'SERVER_ERROR',
      message: 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่',
    })
  })
})
