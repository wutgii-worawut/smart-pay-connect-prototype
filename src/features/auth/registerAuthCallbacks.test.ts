import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import liff from '@line/liff'
import * as apiClient from '@/lib/api-client'
import { registerAuthCallbacks } from './registerAuthCallbacks'
import { useAuthStore } from './stores/authStore'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
})
afterAll(() => server.close())

describe('registerAuthCallbacks', () => {
  // ต้องอยู่ก่อนเทสต์อื่นในไฟล์นี้: `registered` เป็น module-level flag คงอยู่ข้าม it() ในไฟล์
  // เดียวกัน (เทียบกับกับดัก liffInitPromise ใน progress.md P3#6) — เทสต์นี้ต้องเป็นครั้งแรกที่
  // เรียก registerAuthCallbacks() ในไฟล์ ไม่งั้น setter สองตัวจะถูกเรียกไปแล้วจากเทสต์ก่อนหน้า
  it('เรียกซ้ำหลายครั้ง (idempotent) → setOnIdTokenExpired/setOnUnauthorized ถูก set แค่ครั้งเดียว (F3)', () => {
    const idTokenExpiredSpy = vi.spyOn(apiClient, 'setOnIdTokenExpired')
    const unauthorizedSpy = vi.spyOn(apiClient, 'setOnUnauthorized')

    registerAuthCallbacks()
    registerAuthCallbacks()
    registerAuthCallbacks()

    expect(idTokenExpiredSpy).toHaveBeenCalledOnce()
    expect(unauthorizedSpy).toHaveBeenCalledOnce()
  })

  it('ID_TOKEN_EXPIRED → เรียก liff.logout() แล้ว liff.login() (§13.3)', async () => {
    const logoutSpy = vi.spyOn(liff, 'logout').mockImplementation(() => undefined)
    const loginSpy = vi.spyOn(liff, 'login').mockImplementation(() => undefined)
    registerAuthCallbacks()

    server.use(
      http.get('/protected-expired', () =>
        HttpResponse.json(
          { error: { code: 'ID_TOKEN_EXPIRED', message: 'โทเคนหมดอายุ กรุณาเข้าใหม่' } },
          { status: 401 },
        ),
      ),
    )

    await expect(apiClient.api.get('/protected-expired')).rejects.toMatchObject({ code: 'ID_TOKEN_EXPIRED' })

    expect(logoutSpy).toHaveBeenCalledOnce()
    expect(loginSpy).toHaveBeenCalledOnce()
  })

  it('UNAUTHORIZED → ล้าง session ผ่าน clearSession (§13.1, §16.2)', async () => {
    registerAuthCallbacks()
    useAuthStore.getState().setSession('token-x', { id: 'e1', name: 'ทดสอบ', role: 'employee' })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    server.use(
      http.get('/protected-unauth', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบใหม่' } },
          { status: 401 },
        ),
      ),
    )

    await expect(apiClient.api.get('/protected-unauth')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})
