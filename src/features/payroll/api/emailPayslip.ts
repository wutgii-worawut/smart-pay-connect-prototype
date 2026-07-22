/**
 * features/payroll/api/emailPayslip.ts — POST /payroll/payslips/{id}/email (§16.3, feature-plans/05, P21)
 *
 * ไม่มี body ส่งไป (ไม่มีช่องกรอกอีเมลในแอปเด็ดขาด — backend ส่งไปอีเมลที่ลงทะเบียนไว้ ใช้ตัวตนจาก JWT
 * เท่านั้น, code-style.md "ห้ามส่งอีเมลปลายทาง/userId จาก client")
 *
 * 🔴 [กับดัก P2 #5ข, บันทึกแก้แผน progress.md] response ของ endpoint นี้คาดว่าเป็น **204 body ว่าง**
 * (ไม่ใช่ envelope `{data}` ปกติ) — จึงคืน `Promise<void>` และ**ไม่แตะ field ใดของผลลัพธ์เลย** (ไม่ parse
 * เป็น object ไม่ destructure) กัน error ต่อเนื่องถ้า body ว่างจริง
 */
import { api } from '@/lib/api-client'

export async function emailPayslip(id: string): Promise<void> {
  await api.post<undefined>(`/payroll/payslips/${id}/email`)
}
