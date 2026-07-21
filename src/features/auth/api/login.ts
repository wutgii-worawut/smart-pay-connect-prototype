/**
 * features/auth/api/login.ts — POST /auth/login (§13.1, §13.4, §16.3)
 *
 * ⚠️ NEED_REGISTER shape (P2 trap, ดู plan/progress.md บันทึกแก้แผน P2#3): §13.4 pseudocode ของ
 * backend เขียนตอบ `res.status(200).json({ code: 'NEED_REGISTER' })` แบบไม่มี envelope `{data}`
 * ซึ่งชนกับ response interceptor ของเรา (คืน `res.data.data` เสมอตาม §16.1 — ถ้า backend จริงตอบ
 * ตาม pseudocode ตรง ๆ จะได้ `undefined` เงียบ ๆ ไม่ throw)
 *
 * probe mock service จริงแล้ว (2026-07-21): idToken ใดก็ตามที่ส่งไป (รวม `'id_token'` ค่า default
 * ของ liff-mock, ค่าสุ่ม, ค่าที่ไม่เคยลงทะเบียน) ตอบ 200 authenticated เสมอ — **ไม่เคยเจอ
 * NEED_REGISTER จริงจากมock service ให้ยืนยัน shape ได้** จึงเลือกทำ contract ฝั่งเราแบบ
 * envelope-consistent ตาม §16.1: `{ data: { status: 'NEED_REGISTER' } }` (ไม่ใช่ bare
 * `{code:'NEED_REGISTER'}` ตาม §13.4) — ต้อง flag ให้ผู้ใช้รู้ว่า backend จริงต้องคืนแบบ wrapped
 * เช่นกัน ไม่งั้น frontend จะเงียบเป็น undefined แทนที่จะพาไปหน้า register (ดูรายงานสรุปของ P8)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { Employee } from '../types/auth'

/**
 * employee schema จงใจรับแค่ field ที่เราต้องใช้ (id/name/role) — response จริงจาก mock service
 * มี field เพิ่ม (code, position, email, managerId, hireDate, department) แต่ยังไม่มีจอไหนใช้
 * ตอนนี้ (P8) `z.object` ของ Zod ตัด field ที่ไม่ได้ประกาศทิ้งอัตโนมัติ (ไม่ strict) — เพิ่ม field
 * ทีหลังได้โดยไม่พังของเดิม
 */
const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['employee', 'manager']),
})

const loginSuccessSchema = z.object({
  token: z.string(),
  employee: employeeSchema,
})

const needRegisterSchema = z.object({
  status: z.literal('NEED_REGISTER'),
})

const loginResponseSchema = z.union([loginSuccessSchema, needRegisterSchema])

export type LoginResult =
  | { status: 'authenticated'; token: string; employee: Employee }
  | { status: 'need_register' }

export async function login(idToken: string): Promise<LoginResult> {
  const payload = await api.post<unknown>('/auth/login', { idToken })
  const parsed = loginResponseSchema.parse(payload)

  if ('token' in parsed) {
    return { status: 'authenticated', token: parsed.token, employee: parsed.employee }
  }

  return { status: 'need_register' }
}
