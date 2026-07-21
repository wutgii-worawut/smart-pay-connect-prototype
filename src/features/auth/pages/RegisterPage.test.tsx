import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { authHandlers } from '@/mocks/handlers/auth'
import { RegisterPage } from './RegisterPage'
import { useAuthStore } from '../stores/authStore'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useAuthStore.getState().clearSession()
  vi.unstubAllEnvs()
})
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  const router = createMemoryRouter(
    [
      { path: '/register', element: <RegisterPage /> },
      { path: '/', element: <p>หน้าแรก</p> },
    ],
    { initialEntries: ['/register'] },
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  it('authenticated อยู่แล้วเปิด /register ตรง ๆ → เด้งกลับ / (P8 กับดัก P9)', async () => {
    useAuthStore.getState().setSession('jwt', { id: 'e1', name: 'สมชาย', role: 'employee' })

    renderPage()

    expect(await screen.findByText('หน้าแรก')).toBeInTheDocument()
    expect(screen.queryByText('ลงทะเบียนผู้ใช้งาน')).not.toBeInTheDocument()
  })

  it('mode "form" → แสดงฟอร์ม ไม่มีปุ่ม ThaID', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'form')

    renderPage()

    expect(screen.getByLabelText(/เลขประจำตัวประชาชน/)).toBeInTheDocument()
    expect(screen.queryByText('แอปพลิเคชัน ThaID')).not.toBeInTheDocument()
  })

  it('mode "both" (ค่าเริ่มต้น) → แสดงฟอร์ม + ปุ่ม ThaID', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'both')

    renderPage()

    expect(screen.getByLabelText(/เลขประจำตัวประชาชน/)).toBeInTheDocument()
    expect(screen.getByText('แอปพลิเคชัน ThaID')).toBeInTheDocument()
  })

  it('mode "thaid" → ตัดฟอร์มออก เหลือปุ่ม ThaID การ์ดใหญ่อย่างเดียว (จอ 1.2)', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'thaid')

    renderPage()

    expect(screen.queryByLabelText(/เลขประจำตัวประชาชน/)).not.toBeInTheDocument()
    expect(screen.getByText('แอปพลิเคชัน ThaID')).toBeInTheDocument()
    expect(screen.getByText('ด้วย Digital ID')).toBeInTheDocument()
  })
})
