/**
 * app/ApprovalDetailRoute.test.tsx — role gate ของ `/approval/:id` (P20 — มิเรอร์
 * `app/ApprovalRoute.test.tsx` P19 ทุกประการ) ทดสอบที่ระดับ `app/` เพราะต้อง import ทั้ง
 * `features/auth` (ProtectedRoute/useAuthStore) และ `features/approval` (ApprovalDetailPage) ซึ่ง
 * `features/approval` เองห้าม import ข้าม feature ตามกฎเหล็ก §6 (จึงทดสอบ role gate ที่นี่แทนไฟล์
 * เทสต์ในฟีเจอร์)
 */
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { approvalHandlers, resetApprovalScenarios } from '@/mocks/handlers/approval'
import { ProtectedRoute, useAuthStore } from '@/features/auth'
import { ApprovalDetailPage } from '@/features/approval/pages/ApprovalDetailPage'

const server = setupServer(...approvalHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetApprovalScenarios()
  useAuthStore.getState().clearSession()
})
afterAll(() => server.close())

function renderRouter() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>หน้าแรก</p> },
      {
        path: '/approval/:id',
        element: (
          <ProtectedRoute requireRole="manager">
            <ApprovalDetailPage />
          </ProtectedRoute>
        ),
      },
    ],
    { initialEntries: ['/approval/approval-pending-1'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('ApprovalDetailPage route role gate (ProtectedRoute requireRole="manager")', () => {
  it('non-manager (role employee) เข้า /approval/:id → ถูก redirect ไป "/"', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' })
    renderRouter()

    expect(await screen.findByText('หน้าแรก')).toBeInTheDocument()
  })

  it('manager เข้า /approval/:id → เห็นหน้ารายละเอียดใบลาปกติ', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    renderRouter()

    expect(await screen.findByText('นายกุหลาบ ประพฤติดี')).toBeInTheDocument()
  })
})
