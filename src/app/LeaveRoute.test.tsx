import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { approvalHandlers, resetApprovalScenarios } from '@/mocks/handlers/approval'
import { leaveHandlers } from '@/mocks/handlers/leave'
import { useAuthStore } from '@/features/auth'
import { LeaveRoute } from './LeaveRoute'

const server = setupServer(...leaveHandlers, ...approvalHandlers)

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

function renderRoute() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/leave', element: <LeaveRoute /> }], {
    initialEntries: ['/leave'],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('LeaveRoute — non-regression P14', () => {
  it('พนักงานทั่วไป (role employee) → ไม่เห็นแท็บบนสุด การลาของฉัน|รออนุมัติ เหมือน P14 เดิม', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' })
    renderRoute()

    expect(await screen.findByText('วันลาคงเหลือ')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'การลาของฉัน' })).not.toBeInTheDocument()
  })

  it('manager → เห็นแท็บบนสุด "การลาของฉัน | รออนุมัติ" เหนือ LeaveShellPage', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    renderRoute()

    expect(await screen.findByRole('tab', { name: 'การลาของฉัน' })).toBeInTheDocument()
    expect(await screen.findByText('วันลาคงเหลือ')).toBeInTheDocument()
  })
})
