import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  approvalHandlers,
  resetApprovalScenarios,
  setApprovalHistoryScenario,
  setApprovalPendingScenario,
} from '@/mocks/handlers/approval'
import { ApprovalListPage } from './ApprovalListPage'

const server = setupServer(...approvalHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  // fix "วันนี้" กันค่าเริ่มต้นของ filter ปี/เดือน ไม่ deterministic (testing.md)
  vi.setSystemTime(new Date('2026-07-21T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  resetApprovalScenarios()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderPage(initialEntries: string[] = ['/approval']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/approval', element: <ApprovalListPage managerName="วิชัย มั่นคง" /> },
      { path: '/approval/:id', element: <p>รายละเอียดคำขอลา</p> },
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

describe('ApprovalListPage', () => {
  it('view เริ่มต้น = แท็บรออนุมัติ → แสดงรายการจาก GET /approval/pending', async () => {
    renderPage()

    expect(await screen.findAllByText('นายกุหลาบ ประพฤติดี')).toHaveLength(2)
    expect(screen.getByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    expect(screen.getByText('16–17 มิ.ย. 2569 · 2 วัน · เต็มวัน')).toBeInTheDocument()
    // badge count บนแท็บใน = 2 (จำนวนใบรออนุมัติ)
    expect(screen.getByRole('tab', { name: /รออนุมัติ/ })).toHaveTextContent('2')
  })

  it('กดแท็บ "ประวัติการอนุมัติ" → แสดงรายการจาก GET /approval/history', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('นายกุหลาบ ประพฤติดี')

    await user.click(screen.getByRole('tab', { name: 'ประวัติการอนุมัติ' }))

    await waitFor(() => {
      expect(screen.getAllByText('นายกุหลาบ ประพฤติดี')).toHaveLength(2)
    })
    expect(screen.getAllByText('อนุมัติแล้ว', { selector: 'span' })).toHaveLength(2)
  })

  it('กดการ์ด → navigate ไป /approval/:id', async () => {
    const user = userEvent.setup()
    renderPage()
    const meta = await screen.findByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')

    const card = meta.closest('button')
    expect(card).not.toBeNull()
    if (card) await user.click(card)

    expect(await screen.findByText('รายละเอียดคำขอลา')).toBeInTheDocument()
  })

  it('scenario empty → EmptyState ในแท็บรออนุมัติ', async () => {
    setApprovalPendingScenario('empty')
    renderPage()

    expect(await screen.findByText('ไม่มีใบลาที่รออนุมัติ')).toBeInTheDocument()
  })

  it('scenario error → ErrorState พร้อมปุ่มลองใหม่ กดแล้ว refetch สำเร็จ', async () => {
    setApprovalPendingScenario('error')
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText('โหลดรายการรออนุมัติไม่สำเร็จ กรุณาลองใหม่'),
    ).toBeInTheDocument()

    setApprovalPendingScenario('data')
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    await waitFor(() => {
      expect(screen.getByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    })
  })

  it('scenario error ในแท็บประวัติ → ErrorState เฉพาะแท็บนั้น', async () => {
    setApprovalHistoryScenario('error')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('นายกุหลาบ ประพฤติดี')

    await user.click(screen.getByRole('tab', { name: 'ประวัติการอนุมัติ' }))

    expect(
      await screen.findByText('โหลดประวัติการอนุมัติไม่สำเร็จ กรุณาลองใหม่'),
    ).toBeInTheDocument()
  })

  it('เข้าด้วย URL ?tab=history โดยตรง → แสดงรายการประวัติทันที (restore จาก URL)', async () => {
    renderPage(['/approval?tab=history'])

    await waitFor(() => {
      expect(screen.getAllByText('นายกุหลาบ ประพฤติดี')).toHaveLength(2)
    })
    expect(screen.getAllByText('อนุมัติแล้ว', { selector: 'span' })).toHaveLength(2)
  })

  it('แสดงชื่อหัวหน้าใน ManagerBanner', async () => {
    renderPage()

    expect(await screen.findByText('คุณวิชัย มั่นคง')).toBeInTheDocument()
  })
})
