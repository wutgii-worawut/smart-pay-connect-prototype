import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { requestOtp } from './requestOtp'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('requestOtp()', () => {
  it('สำเร็จ → คืน refCode + email', async () => {
    server.use(
      http.post('/auth/register/request-otp', () =>
        HttpResponse.json({ data: { refCode: 'REF-9999', email: 'spuser@sp.go.th' } }),
      ),
    )

    const result = await requestOtp({ citizenId: '1234567890121', email: 'spuser@sp.go.th' })

    expect(result).toEqual({ refCode: 'REF-9999', email: 'spuser@sp.go.th' })
  })

  it('response ไม่ตรง contract (ไม่มี refCode) → throw (Zod validate ที่ boundary, §16.1)', async () => {
    server.use(
      http.post('/auth/register/request-otp', () =>
        HttpResponse.json({ data: { email: 'spuser@sp.go.th' } }),
      ),
    )

    await expect(
      requestOtp({ citizenId: '1234567890121', email: 'spuser@sp.go.th' }),
    ).rejects.toThrow()
  })

  it('server ตอบ error envelope (§16.1) → ApiError หลุดออกจาก interceptor ตรง ๆ', async () => {
    server.use(
      http.post('/auth/register/request-otp', () =>
        HttpResponse.json(
          { error: { code: 'EMPLOYEE_NOT_FOUND', message: 'ไม่พบข้อมูลพนักงาน' } },
          { status: 404 },
        ),
      ),
    )

    await expect(
      requestOtp({ citizenId: '1234567890121', email: 'spuser@sp.go.th' }),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_NOT_FOUND', message: 'ไม่พบข้อมูลพนักงาน' })
  })
})
