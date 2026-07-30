import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { queryClient as appQueryClient } from '@/lib/query-client'
import { authHandlers, setAuthScenario } from '@/mocks/handlers/auth'
import { useAuthBootstrap } from './useAuthBootstrap'
import { useAuthStore } from '../stores/authStore'

const server = setupServer(...authHandlers)

// เก็บ unsubscribe ของ `countLoginHits` แต่ละเทสต์ไว้ถอดใน afterEach — server.events เป็น emitter
// ระดับไฟล์ (ผูกกับ server ตัวเดียวที่ setupServer ไว้ด้านบน) ถ้าไม่ถอด listener จะสะสมข้ามเทสต์
// ในไฟล์นี้ไปเรื่อย ๆ (ไม่กระทบ assert เพราะ hitCount อยู่ใน closure แยกของแต่ละเทสต์ แต่เป็นขยะ
// ที่ไม่ควรมี)
let loginHitUnsubscribers: Array<() => void> = []

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
  loginHitUnsubscribers.forEach((unsubscribe) => unsubscribe())
  loginHitUnsubscribers = []
  // เทสต์ loop guard ด้านล่างเปิด fake timers เอง (ต้อง advance เวลาแบบควบคุมได้เพื่อจำลอง "เร็ว
  // ผิดปกติ" ของ threshold 10 วิ) — คืนเป็น real timers เสมอกันรั่วข้ามเทสต์ถัดไป/ไฟล์อื่น แม้เทสต์
  // จะ throw ก่อนถึงบรรทัด vi.useRealTimers() ในตัวมันเอง (เช่นตอนพิสูจน์บั๊กที่ยังไม่แก้)
  vi.useRealTimers()
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
  const listener = ({ request }: { request: Request }) => {
    if (request.url.endsWith('/auth/login')) hitCount += 1
  }
  server.events.on('request:start', listener)
  loginHitUnsubscribers.push(() => server.events.removeListener('request:start', listener))
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

  it('login สำเร็จ (200) ซ้ำแล้ว session หลุดต่อเนื่องเร็วผิดปกติ (backend ปฏิเสธ JWT ต่อ แม้ login เองผ่าน — key rotation/clock skew/revoke) → loop guard ตัดที่ error ไม่ยิง /auth/login รัวไม่มีเพดาน (🔴 loop guard must-fix)', async () => {
    vi.useFakeTimers()
    const hits = countLoginHits()

    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    /** เดินเวลา fake timer เป็นก้อนเล็ก ๆ จนกว่า status จะถึง target หรือครบเพดานความพยายาม —
     *  MSW resolve response ผ่าน microtask/setImmediate ที่ fake timers ครอบอยู่ด้วย (แบบเดียวกับ
     *  AuthGate.test.tsx) จึงต้อง advance ให้ event loop เดินจริง ไม่ใช่แค่ awaited เฉย ๆ */
    async function flushUntil(target: string) {
      await act(async () => {
        for (let i = 0; i < 30 && result.current !== target; i += 1) {
          await vi.advanceTimersByTimeAsync(50)
        }
      })
    }

    await flushUntil('ready')
    expect(result.current).toBe('ready')

    // จำลอง onUnauthorized เรียก clearSession() ซ้ำเร็ว ๆ (< 10 วิ ต่อรอบ) เหมือน data endpoint
    // ตอบ 401 ต่อเนื่องทุกครั้งที่ login กลับมาสำเร็จใหม่ — วนติดกัน 3 รอบ (เกิน
    // MAX_FAST_RELOGIN_ATTEMPTS=2 ที่ตั้งไว้ในฮุค) รอบที่ 1-2 ต้อง re-login สำเร็จกลับไป 'ready' ได้
    // ปกติ (ยังไม่ชนเพดาน) รอบที่ 3 ต้องโดน guard ตัด
    for (let round = 0; round < 3; round += 1) {
      await act(async () => {
        useAuthStore.getState().clearSession()
        await vi.advanceTimersByTimeAsync(200) // เร็วมาก << เกณฑ์ 10 วิ ของ loop guard
      })

      if (round < 2) {
        await flushUntil('ready')
        expect(result.current).toBe('ready')
      }
    }

    await flushUntil('error')
    expect(result.current).toBe('error')
    // login สำเร็จรอบแรก + re-login สำเร็จอีก 2 รอบ (round 0,1) = 3 ครั้ง แล้วรอบที่ 3 (round 2)
    // ต้องถูกตัดก่อนยิง request ที่ 4 — มีเพดานจริง ไม่ใช่วนไม่รู้จบ
    expect(hits.get()).toBe(3)

    vi.useRealTimers()
  })

  it('ตัวนับ re-login เร็วผิดปกติ reset เมื่อห่างเกิน LOOP_WINDOW_MS แล้ว (session หลุดตามอายุ JWT จริง เป็นชั่วโมง) → ไม่สะสมข้ามช่วงเวลาไกลกัน ยังกลับ ready ได้ปกติ ไม่โดนตัดเป็น error (consultant follow-up #1 — คุ้ม branch `reloginAttemptsRef.current = isFastLoop ? ... : 0` ฝั่ง reset)', async () => {
    vi.useFakeTimers()
    const hits = countLoginHits()

    const { result } = renderHook(() => useAuthBootstrap('id_token'), { wrapper: createWrapper() })

    async function flushUntil(target: string) {
      await act(async () => {
        for (let i = 0; i < 30 && result.current !== target; i += 1) {
          await vi.advanceTimersByTimeAsync(50)
        }
      })
    }

    await flushUntil('ready')
    expect(result.current).toBe('ready')

    // สองรอบแรกเร็ว (< 10 วิ ต่อรอบ เหมือนเทสต์ loop guard เดิม) — ดันตัวนับขึ้นไปที่ 2 (เท่า
    // MAX_FAST_RELOGIN_ATTEMPTS พอดี ยังไม่ชนเพดานเพราะเช็คด้วย `>` ไม่ใช่ `>=`) ต้องกลับ 'ready' ได้
    // ปกติทั้งสองรอบ
    for (let round = 0; round < 2; round += 1) {
      await act(async () => {
        useAuthStore.getState().clearSession()
        await vi.advanceTimersByTimeAsync(200)
      })
      await flushUntil('ready')
      expect(result.current).toBe('ready')
    }

    // เดินเวลาให้ห่างจาก re-login สำเร็จครั้งล่าสุดเกิน LOOP_WINDOW_MS (10 วิ) — จำลอง session ที่หลุด
    // ตามอายุ JWT จริง (เป็นชั่วโมง) ไม่ใช่ backend ปฏิเสธ JWT ต่อเนื่องแบบเคสลูปเร็ว
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11_000)
    })

    // รอบที่ 3 นี้ห่างเกินเพดานแล้ว — ถ้า branch reset (`reloginAttemptsRef.current = 0` ตอน isFastLoop
    // เป็น false) ถูกลบทิ้งไป ตัวนับจะสะสมต่อจาก 2 กลายเป็น 3 > MAX_FAST_RELOGIN_ATTEMPTS แล้วโดน guard
    // ตัดเป็น 'error' ผิด ๆ ทั้งที่นี่คือเคส token หมดอายุตามธรรมชาติที่ guard ตั้งใจ "ไม่" แตะ — เทสต์
    // นี้ยืนยันว่าตัวนับ reset จริงและ status กลับ 'ready' ได้ ไม่ใช่ 'error'
    await act(async () => {
      useAuthStore.getState().clearSession()
      await vi.advanceTimersByTimeAsync(200)
    })

    await flushUntil('ready')
    expect(result.current).toBe('ready')
    // login แรก + re-login สำเร็จอีก 3 ครั้ง (ทุกครั้งสำเร็จ ไม่มีครั้งไหนโดนตัดเป็น error)
    expect(hits.get()).toBe(4)

    vi.useRealTimers()
  })
})
