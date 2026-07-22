import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { approvalHandlers, resetApprovalScenarios } from '@/mocks/handlers/approval'
import { ProtectedRoute, useAuthStore } from '@/features/auth'
import { ApprovalRoute } from './ApprovalRoute'

const server = setupServer(...approvalHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  vi.setSystemTime(new Date('2026-07-21T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  resetApprovalScenarios()
  useAuthStore.getState().clearSession()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderRouter() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>หน้าแรก</p> },
      {
        path: '/approval',
        element: (
          <ProtectedRoute requireRole="manager">
            <ApprovalRoute />
          </ProtectedRoute>
        ),
      },
    ],
    { initialEntries: ['/approval'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('ApprovalRoute role gate (ProtectedRoute requireRole="manager")', () => {
  it('non-manager (role employee) เข้า /approval → ถูก redirect ไป "/"', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' })
    renderRouter()

    expect(await screen.findByText('หน้าแรก')).toBeInTheDocument()
  })

  it('manager เข้า /approval → เห็นหน้า ApprovalListPage ปกติ', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    renderRouter()

    expect(await screen.findByText('คุณวิชัย มั่นคง')).toBeInTheDocument()
  })
})
