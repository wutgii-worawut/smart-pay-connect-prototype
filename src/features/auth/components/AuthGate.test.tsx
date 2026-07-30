import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import liff from '@line/liff'
import { __resetDelayedRevealForTests } from '@/hooks/useDelayedReveal'
import { LiffContext } from '@/lib/liff/liff-context'
import { authHandlers, setAuthScenario } from '@/mocks/handlers/auth'
import { AuthGate } from './AuthGate'
import { useAuthStore } from '../stores/authStore'

const server = setupServer(...authHandlers)

// เก็บ descriptor เดิมของ window.location ไว้ restore หลังเทสต์ที่ redefine มัน (กันรั่วข้ามไฟล์เทสต์
// อื่นที่รันร่วม suite เดียวกัน — Object.defineProperty แบบไม่ restore จะค้าง reload สปายไว้ถาวร)
const originalLocation = Object.getOwnPropertyDescriptor(window, 'location')

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  __resetDelayedRevealForTests()
})
afterEach(() => {
  server.resetHandlers()
  setAuthScenario('authenticated')
  useAuthStore.getState().clearSession()
  vi.restoreAllMocks()
  __resetDelayedRevealForTests()
  vi.useRealTimers()
  if (originalLocation) {
    Object.defineProperty(window, 'location', originalLocation)
  }
})
afterAll(() => server.close())

function renderAuthGate() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  const router = createMemoryRouter(
    [
      {
        element: <AuthGate />,
        children: [{ path: '/', element: <p>เนื้อหาแอป</p> }],
      },
      { path: '/register', element: <p>หน้าลงทะเบียน</p> },
    ],
    { initialEntries: ['/'] },
  )

  return render(
    <LiffContext value={{ status: 'ready', liff }}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </LiffContext>,
  )
}

describe('AuthGate', () => {
  it('authenticated → render เนื้อหา route ลูก (Outlet) + isAuthenticated true', async () => {
    vi.spyOn(liff, 'getIDToken').mockReturnValue('id_token')

    renderAuthGate()

    await waitFor(() => expect(screen.getByText('เนื้อหาแอป')).toBeInTheDocument())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('NEED_REGISTER → เด้งไป /register (§13.2)', async () => {
    vi.spyOn(liff, 'getIDToken').mockReturnValue('id_token')
    setAuthScenario('need_register')

    renderAuthGate()

    await waitFor(() => expect(screen.getByText('หน้าลงทะเบียน')).toBeInTheDocument())
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()
  })

  it('EMPLOYEE_INACTIVE → โชว์ข้อความติดต่อ HR ไม่ render เนื้อหา (§16.2)', async () => {
    vi.spyOn(liff, 'getIDToken').mockReturnValue('id_token')
    setAuthScenario('employee_inactive')

    renderAuthGate()

    await waitFor(() =>
      expect(
        screen.getByText('บัญชีไม่พร้อมใช้งาน กรุณาติดต่อฝ่ายบุคคล (HR)'),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText('เนื้อหาแอป')).not.toBeInTheDocument()
  })

  it('checking → หลังครบ delay โชว์การ์ดขั้นตอนการเชื่อมต่อ ขั้น 2 active', async () => {
    // ใช้ fake timers เดินเวลาเองแทนพึ่ง wall-clock จริง (real setTimeout 300ms ของ useDelayedReveal
    // ชนกับ MSW delay 500ms เป็น race ที่แคบ — ตอนรันเทสต์ทั้ง suite พร้อมกันหลายไฟล์ โหลดสูงทำให้
    // ช่วง 'checking' คลาดเคลื่อนจน getByText หาไม่เจอเป็นครั้งคราว ไม่ deterministic) MSW `delay()`
    // ใช้ global `setTimeout` เหมือนกัน จึงถูก fake timers ครอบคลุมด้วย
    server.use(
      http.post('*/auth/login', async () => {
        await delay(500)
        return HttpResponse.json({
          data: { token: 'mock-jwt-token', employee: { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' } },
        })
      }),
    )
    vi.spyOn(liff, 'getIDToken').mockReturnValue('id_token')
    vi.useFakeTimers()

    renderAuthGate()

    // เดินเวลาให้ครบ 300ms (useDelayedReveal) แต่ POST /auth/login ยังไม่เสร็จ (หน่วง 500ms) →
    // ต้องเห็นการ์ด checking ขั้น 2 active
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    // หัวข้อใหญ่กับข้อความสถานะแถว active ขั้น 2 เป็นคำเดียวกันตาม spec (จงใจ) — เช็คหัวข้อผ่าน role
    // heading ให้เจาะจง กัน getByText ชนกัน 2 จุด
    expect(
      screen.getByRole('heading', { level: 1, name: 'กำลังตรวจสอบสิทธิ์...' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ขั้นตอนการเชื่อมต่อ')).toBeInTheDocument()
    expect(screen.getByText('สำเร็จ')).toBeInTheDocument()

    // เดินเวลาที่เหลือให้ POST /auth/login (500ms) เสร็จสมบูรณ์ก่อนจบเทสต์ — ไม่งั้น request นี้ยัง
    // ค้างอยู่ตอน afterEach เรียก vi.restoreAllMocks() แล้วมา resolve ทีหลังกลางเทสต์ถัดไป (เรียก
    // liff.getIDToken() ของจริงที่ไม่ได้ mock แล้วโยน error 'liffId is necessary') ทำให้เทสต์ถัดไป flaky
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(screen.getByText('เนื้อหาแอป')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('idToken เป็น null → status error ทันที โชว์การ์ด error ขั้น 2 + ปุ่มลองใหม่ reload หน้า', async () => {
    const user = userEvent.setup()
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    })
    vi.spyOn(liff, 'getIDToken').mockReturnValue(null)

    renderAuthGate()

    // idToken null → useAuthBootstrap คืน 'error' ทันทีตั้งแต่ render แรก ไม่มี mutate/รอ network เลย
    // (ดู useAuthBootstrap.ts บรรทัด "ไม่มี idToken ให้ยิงเลย") — เช็คแบบ sync เพื่อพิสูจน์เชิงกลไกว่า
    // error โชว์ทันทีไม่รอ delay ใด ๆ (แบบเดียวกับ LiffGate.test.tsx เคส error)
    expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})
