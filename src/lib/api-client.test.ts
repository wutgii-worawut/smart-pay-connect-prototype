import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { api, ApiError, setAuthToken } from './api-client'

/**
 * หมายเหตุ: Vitest รัน mode 'test' โดย default (ไม่โหลด `.env.development`)
 * `VITE_API_URL` จึงเป็น undefined ในเทสต์ → axios baseURL ว่าง, request จริง
 * ไปที่ path ตรง ๆ (relative ต่อ jsdom location) — ใช้ path handler เฉย ๆ พอ
 * เพราะสิ่งที่เทสต์คือพฤติกรรม interceptor ไม่ใช่ baseURL
 */

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  setAuthToken(null)
})
afterAll(() => server.close())

describe('api-client response interceptor', () => {
  it('แกะ envelope { data } คืนค่า payload ตรง ๆ', async () => {
    server.use(http.get('/ping', () => HttpResponse.json({ data: { ok: true } })))

    const result = await api.get<{ ok: boolean }>('/ping')

    expect(result).toEqual({ ok: true })
  })

  it('normalize envelope { error } เป็น ApiError { code, message, status }', async () => {
    server.use(
      http.get('/fail', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'กรุณากรอกข้อมูล' } },
          { status: 400 },
        ),
      ),
    )

    await expect(api.get('/fail')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'กรุณากรอกข้อมูล',
      status: 400,
    })
    await expect(api.get('/fail')).rejects.toBeInstanceOf(ApiError)
  })

  it('ตอบ error ที่ไม่มี response (เน็ตหลุด) → ApiError NETWORK_ERROR status 0', async () => {
    server.use(http.get('/timeout', () => HttpResponse.error()))

    await expect(api.get('/timeout')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
      status: 0,
    })
  })

  it('response ที่ไม่มี error envelope → code/message generic', async () => {
    server.use(http.get('/broken', () => HttpResponse.json({}, { status: 500 })))

    await expect(api.get('/broken')).rejects.toMatchObject({
      code: 'UNKNOWN',
      message: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      status: 500,
    })
  })
})

describe('api-client request interceptor', () => {
  it('แนบ Authorization header จาก setAuthToken เมื่อมีการตั้งค่า', async () => {
    setAuthToken('test-token')
    let receivedAuth: string | null = null
    server.use(
      http.get('/secure', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ data: {} })
      }),
    )

    await api.get('/secure')

    expect(receivedAuth).toBe('Bearer test-token')
  })

  it('ไม่แนบ Authorization header เมื่อไม่ได้ setAuthToken', async () => {
    let receivedAuth: string | null = null
    server.use(
      http.get('/public', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ data: {} })
      }),
    )

    await api.get('/public')

    expect(receivedAuth).toBeNull()
  })
})
