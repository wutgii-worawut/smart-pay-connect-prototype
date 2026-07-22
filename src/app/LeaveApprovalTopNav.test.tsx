import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { approvalHandlers, resetApprovalScenarios } from '@/mocks/handlers/approval'
import { useAuthStore } from '@/features/auth'
import { LeaveApprovalTopNav } from './LeaveApprovalTopNav'

const server = setupServer(...approvalHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetApprovalScenarios()
  useAuthStore.getState().clearSession()
})
afterAll(() => server.close())

function renderNav(initialEntries: string[] = ['/leave']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/leave', element: <LeaveApprovalTopNav /> },
      { path: '/approval', element: <LeaveApprovalTopNav /> },
    ],
    { initialEntries },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

/** นับจำนวนครั้งที่ GET /approval/pending ถูกยิงจริง (มิเรอร์ pattern `useClockIn.test.tsx`) —
 * ใช้พิสูจน์ M1 (consultant review): non-manager ต้อง**ไม่ยิง**ก่อน `enabled` ตัดสิน */
function countPendingHits(): { get: () => number } {
  let hitCount = 0
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/approval/pending')) hitCount += 1
  })
  return { get: () => hitCount }
}

describe('LeaveApprovalTopNav', () => {
  it('non-manager → ไม่ render อะไรเลย (คืน null) และไม่ยิง GET /approval/pending (M1 regression guard)', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee' })
    const hits = countPendingHits()
    const router = createMemoryRouter([{ path: '/leave', element: <LeaveApprovalTopNav /> }], {
      initialEntries: ['/leave'],
    })
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(container).toBeEmptyDOMElement()
    // รอ tick เผื่อ query หลุด enabled:false ยิงจริง (ถ้า regression กลับมา hits จะ > 0)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hits.get()).toBe(0)
  })

  it('manager → เห็น 2 แท็บ พร้อม badge จำนวนรออนุมัติ', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    renderNav()

    expect(await screen.findByRole('tab', { name: 'การลาของฉัน' })).toBeInTheDocument()
    const approvalTab = await screen.findByRole('tab', { name: /รออนุมัติ/ })
    expect(approvalTab).toHaveTextContent('2')
  })

  it('อยู่ที่ /approval → แท็บ "รออนุมัติ" active', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    renderNav(['/approval'])

    const approvalTab = await screen.findByRole('tab', { name: /รออนุมัติ/ })
    expect(approvalTab).toHaveAttribute('aria-selected', 'true')
  })

  it('manager กดแท็บ "การลาของฉัน"/"รออนุมัติ" → navigate ไป route ที่ตรงกัน', async () => {
    useAuthStore.getState().setSession('mock-token', { id: 'EMP-MGR-001', name: 'วิชัย มั่นคง', role: 'manager' })
    const user = userEvent.setup()
    const router = renderNav()
    await screen.findByRole('tab', { name: /รออนุมัติ/ })

    await user.click(screen.getByRole('tab', { name: /รออนุมัติ/ }))
    expect(router.state.location.pathname).toBe('/approval')
  })
})
