import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import liff from '@line/liff'
import { LiffContext } from '@/lib/liff/liff-context'
import { authHandlers, setAuthScenario } from '@/mocks/handlers/auth'
import { AuthGate } from './AuthGate'
import { useAuthStore } from '../stores/authStore'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  setAuthScenario('authenticated')
  useAuthStore.getState().clearSession()
  vi.restoreAllMocks()
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
})
