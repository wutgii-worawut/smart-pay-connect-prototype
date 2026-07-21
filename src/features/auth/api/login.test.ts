import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { login } from './login'

/** หมายเหตุเดียวกับ lib/api-client.test.ts: VITE_API_URL ว่างตอนเทสต์ → ใช้ path ตรง ๆ พอ */
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('login()', () => {
  it('สำเร็จ → คืน status authenticated พร้อม token/employee', async () => {
    server.use(
      http.post('/auth/login', () =>
        HttpResponse.json({
          data: { token: 'jwt-1', employee: { id: 'e1', name: 'สมชาย', role: 'employee' } },
        }),
      ),
    )

    const result = await login('id_token')

    expect(result).toEqual({
      status: 'authenticated',
      token: 'jwt-1',
      employee: { id: 'e1', name: 'สมชาย', role: 'employee' },
    })
  })

  it('ยังไม่ผูกบัญชี (envelope-consistent) → คืน status need_register', async () => {
    server.use(
      http.post('/auth/login', () => HttpResponse.json({ data: { status: 'NEED_REGISTER' } })),
    )

    const result = await login('id_token')

    expect(result).toEqual({ status: 'need_register' })
  })

  it('response ไม่ตรง contract → throw (Zod validate ที่ boundary, §16.1)', async () => {
    server.use(http.post('/auth/login', () => HttpResponse.json({ data: { foo: 'bar' } })))

    await expect(login('id_token')).rejects.toThrow()
  })

  it('regression guard: backend ตอบ bare {code:"NEED_REGISTER"} ไม่มี envelope (ตาม §13.4 pseudocode ที่ไม่ตรงกับ §16.1) → fail-loud (throw) ไม่ใช่คืน undefined เงียบ ๆ', async () => {
    // interceptor คืน res.data.data เสมอ — response ที่ไม่มี key "data" ห่ออยู่จะได้ payload
    // เป็น undefined เข้า loginResponseSchema.parse() ต้อง throw ทันที ไม่ใช่ผ่านไปเงียบ ๆ
    // (ถ้า backend จริงทำตาม pseudocode §13.4 ตรง ๆ โดยไม่ห่อ envelope นี่คือพฤติกรรมที่จะเกิด)
    server.use(http.post('/auth/login', () => HttpResponse.json({ code: 'NEED_REGISTER' })))

    await expect(login('id_token')).rejects.toThrow()
  })

  it('employee มี field เกินสัญญา (ตรงกับ response จริงของ mock service) ยัง parse ผ่าน', async () => {
    server.use(
      http.post('/auth/login', () =>
        HttpResponse.json({
          data: {
            token: 'jwt-2',
            employee: {
              id: 'e01009',
              code: '01009',
              name: 'กุหลาบ ประพฤติดี',
              position: 'ธุรการ',
              role: 'employee',
              email: 'kuhlab.pr@sp.go.th',
              managerId: 'e01001',
              hireDate: '2017-01-01',
              department: 'สำนักงานใหญ่',
            },
          },
        }),
      ),
    )

    const result = await login('id_token')

    expect(result).toEqual({
      status: 'authenticated',
      token: 'jwt-2',
      employee: { id: 'e01009', name: 'กุหลาบ ประพฤติดี', role: 'employee' },
    })
  })
})
