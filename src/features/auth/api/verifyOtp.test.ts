import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { verifyOtp } from './verifyOtp'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('verifyOtp()', () => {
  it('สำเร็จ → คืน token + employee', async () => {
    server.use(
      http.post('/auth/register/verify-otp', () =>
        HttpResponse.json({
          data: { token: 'jwt-otp-1', employee: { id: 'e1', name: 'สมชาย', role: 'employee' } },
        }),
      ),
    )

    const result = await verifyOtp({ otp: 'A1B2C3', refCode: 'REF-1234' })

    expect(result).toEqual({
      token: 'jwt-otp-1',
      employee: { id: 'e1', name: 'สมชาย', role: 'employee' },
    })
  })

  it('response ไม่ตรง contract (ไม่มี token) → throw (Zod validate ที่ boundary, §16.1)', async () => {
    server.use(
      http.post('/auth/register/verify-otp', () =>
        HttpResponse.json({ data: { employee: { id: 'e1', name: 'สมชาย', role: 'employee' } } }),
      ),
    )

    await expect(verifyOtp({ otp: 'A1B2C3', refCode: 'REF-1234' })).rejects.toThrow()
  })

  it('server ตอบ OTP_INVALID → ApiError หลุดออกจาก interceptor ตรง ๆ', async () => {
    server.use(
      http.post('/auth/register/verify-otp', () =>
        HttpResponse.json(
          { error: { code: 'OTP_INVALID', message: 'รหัส OTP ไม่ถูกต้อง' } },
          { status: 400 },
        ),
      ),
    )

    await expect(
      verifyOtp({ otp: 'WRONG1', refCode: 'REF-1234' }),
    ).rejects.toMatchObject({ code: 'OTP_INVALID', message: 'รหัส OTP ไม่ถูกต้อง' })
  })

  it('server ตอบ OTP_EXPIRED → ApiError หลุดออกจาก interceptor ตรง ๆ', async () => {
    server.use(
      http.post('/auth/register/verify-otp', () =>
        HttpResponse.json(
          { error: { code: 'OTP_EXPIRED', message: 'รหัส OTP หมดอายุ กรุณาขอรหัสใหม่' } },
          { status: 400 },
        ),
      ),
    )

    await expect(
      verifyOtp({ otp: 'A1B2C3', refCode: 'REF-1234' }),
    ).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
  })
})
