import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { queryClient as appQueryClient } from '@/lib/query-client'
import { authHandlers, setAuthScenario } from '@/mocks/handlers/auth'
import { useAuthBootstrap } from './useAuthBootstrap'
import { useAuthStore } from '../stores/authStore'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  // ต้อง unmount hook ของเทสต์ก่อนหน้าให้เสร็จก่อนแตะ global state (useAuthStore) — ลำดับ
  // afterEach ของ setup.ts (root, ทำ cleanup()) เทียบกับ afterEach ของไฟล์นี้ไม่ garantee ว่า
  // อันไหนรันก่อน ถ้า clearSession() ยิงตอน hook เดิมยังไม่ unmount, useEffect "F1 reset
  // startedRef" ในนั้นจะ mutate() ซ้ำแบบ ghost แล้วมา setSession() ทับตอนเทสต์ถัดไปกำลังรัน
  // (ผลคือทุกเทสต์หลังจากตัวแรกที่เคย ready เห็น status 'ready' เพี้ยนหมด) — เรียก cleanup()
  // ที่นี่ก่อนเสมอ (idempotent ถ้า setup.ts unmount ไปแล้ว) กันชัวร์
  cleanup()
  server.resetHandlers()
  setAuthScenario('authenticated')
  useAuthStore.getState().clearSession()
  appQueryClient.clear()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

/** ใช้ query-client จริงของแอป (`lib/query-client.ts`) แทนตัวที่ตั้ง retry:0 เฉพาะเทสต์ —
 *  พิสูจน์ config จริงที่แอปใช้งาน ไม่ใช่แค่ค่าที่เทสต์ตั้งเอง (F3 follow-up) */
function AppQueryClientWrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
}

function countLoginHits(): { get: () => number } {
  let hitCount = 0
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/auth/login')) hitCount += 1
  })
  return { get: () => hitCount }
}

describe('useAuthBootstrap', () => {
  it('idToken เป็น null (LIFF ready แต่ getIDToken() ว่าง) → status error ทันที ไม่ยิง request', () => {
    const { result } = renderHook(() => useAuthBootstrap(null), { wrapper: createWrapper() })

    expect(result.current).toBe('error')
  })

  it('authenticated → status ready + setSession ลง store (token/employee)', async () => {
    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('ready'))

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('mock-jwt-token')
    expect(useAuthStore.getState().employee?.role).toBe('employee')
  })

  it('NEED_REGISTER → status need_register ไม่ setSession', async () => {
    setAuthScenario('need_register')
    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('need_register'))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('EMPLOYEE_INACTIVE → status inactive', async () => {
    setAuthScenario('employee_inactive')
    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('inactive'))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('ID_TOKEN_EXPIRED → status checking (redirect ผ่าน liff.logout+login กำลังจะเกิด, §13.3 — ไม่ใช่ error กระพริบ, F2)', async () => {
    setAuthScenario('id_token_expired')
    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('checking'))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('error ที่ไม่รู้จัก (เช่น 500 จาก backend) → status error', async () => {
    server.use(
      http.post('/auth/login', () =>
        HttpResponse.json({ error: { code: 'UNKNOWN', message: 'เกิดข้อผิดพลาด' } }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('error'))
  })

  it('เซสชันหลุดกลางทาง (isAuthenticated true→false ผ่าน clearSession) → ยิง login ใหม่เอง ไม่ค้าง checking ตลอดกาล (F1 must-fix)', async () => {
    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toBe('ready'))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // จำลอง onUnauthorized เรียก clearSession() กลางทาง (เช่น endpoint อื่นตอบ UNAUTHORIZED)
    useAuthStore.getState().clearSession()

    // ต้องกลับไป 'ready' เองโดยไม่ต้องรีเฟรช/navigate — ไม่ใช่ค้างที่ 'checking' ตลอดไป
    await waitFor(() => expect(result.current).toBe('ready'))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('ไม่ retry อัตโนมัติ (ใช้ query-client จริงของแอป, F3) — mutate() ยิงครั้งเดียวต่อ idToken', async () => {
    setAuthScenario('employee_inactive')
    const hits = countLoginHits()

    const { result } = renderHook(() => useAuthBootstrap('id_token'), {
      wrapper: AppQueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toBe('inactive'))
    // employee_inactive ไม่มี retry ให้รอเพิ่ม — เผื่อเวลาสั้น ๆ ยืนยันว่าไม่มี request ตามมาอีก
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hits.get()).toBe(1)
  })
})
