import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { leaveHandlers, resetLeaveScenarios, setLeaveRequestsScenario } from '@/mocks/handlers/leave'
import { LeaveShellPage } from './LeaveShellPage'

const server = setupServer(...leaveHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  // fix "วันนี้" กันค่าเริ่มต้นของ year stepper/ตัวเลือกปี ไม่ deterministic (testing.md)
  vi.setSystemTime(new Date('2026-07-21T09:00:00+07:00'))
})
afterEach(() => {
  server.resetHandlers()
  resetLeaveScenarios()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderPage(initialEntries: string[] = ['/leave']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/leave', element: <LeaveShellPage /> },
      { path: '/leave/new', element: <p>ยื่นใบลา</p> },
      { path: '/leave/:id', element: <p>รายละเอียดใบลา</p> },
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

describe('LeaveShellPage', () => {
  it('view เริ่มต้น = balance → แสดงการ์ดโควตา 3 ประเภทจาก GET /leave/balance', async () => {
    renderPage()

    expect(await screen.findByText('17')).toBeInTheDocument() // vacation remaining (รอ query resolve)
    expect(screen.getByText('28')).toBeInTheDocument() // sick remaining
    expect(screen.getByText('9')).toBeInTheDocument() // personal remaining
    expect(screen.getByText('ได้รับ 20 วัน · ยกมา 5 วัน')).toBeInTheDocument()
    expect(screen.getByText('ได้รับ 30 วัน')).toBeInTheDocument() // ไม่มี "ยกมา" (carriedOver=0)
    expect(screen.getByText('อยู่ระหว่างรออนุมัติลา 3 วัน')).toBeInTheDocument()
  })

  it('กดปุ่ม "ใบลารออนุมัติ" ที่แถบล่าง → สลับไปแสดงรายการรออนุมัติ 3 ใบ', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))

    expect(await screen.findByRole('heading', { name: 'รออนุมัติลา' })).toBeInTheDocument()
    expect(screen.getByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    expect(screen.getByText('16–17 มิ.ย. 2569 · 2 วัน · เต็มวัน')).toBeInTheDocument()
    expect(screen.getByText('19 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    // { selector: 'span' } กัน match ซ้ำกับ <option> label เดียวกันใน DropdownFilter สถานะ (badge อยู่ใน <span>)
    expect(screen.getAllByText('รออนุมัติ', { selector: 'span' })).toHaveLength(3)
  })

  it('กดปุ่มที่ active อยู่ซ้ำ → toggle กลับไปหน้า balance', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))
    await screen.findByRole('heading', { name: 'รออนุมัติลา' })

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))
    expect(await screen.findByText('วันลาคงเหลือ')).toBeInTheDocument()
  })

  it('กดปุ่ม "ประวัติการลาของฉัน" → แสดงประวัติ 3 ใบ (อนุมัติแล้ว)', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ประวัติการลาของฉัน/ }))

    expect(await screen.findByRole('heading', { name: 'ประวัติการลาของฉัน' })).toBeInTheDocument()
    expect(screen.getByText('1 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    expect(screen.getByText('2 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    expect(screen.getByText('7 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    // { selector: 'span' } กัน match ซ้ำกับ <option> label เดียวกันใน DropdownFilter สถานะ
    expect(screen.getAllByText('อนุมัติแล้ว', { selector: 'span' })).toHaveLength(3)
  })

  it('FilterChips ประเภทลา กรองรายการในหน้าประวัติ', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')
    await user.click(screen.getByRole('tab', { name: /ประวัติการลาของฉัน/ }))
    await screen.findByRole('heading', { name: 'ประวัติการลาของฉัน' })

    await user.click(screen.getByRole('button', { name: 'ลาป่วย' }))

    await waitFor(() => {
      expect(screen.getByText('2 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    })
    expect(screen.queryByText('1 มิ.ย. 2569 · 1 วัน · เต็มวัน')).not.toBeInTheDocument()
    expect(screen.queryByText('7 มิ.ย. 2569 · 1 วัน · เต็มวัน')).not.toBeInTheDocument()
  })

  it('scenario empty → EmptyState ในหน้ารออนุมัติ', async () => {
    setLeaveRequestsScenario('empty')
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))

    expect(await screen.findByText('ไม่มีใบลาที่รออนุมัติ')).toBeInTheDocument()
  })

  it('scenario error → ErrorState พร้อมปุ่มลองใหม่ กดแล้ว refetch สำเร็จ', async () => {
    setLeaveRequestsScenario('error')
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ประวัติการลาของฉัน/ }))
    expect(await screen.findByText('โหลดรายการลาไม่สำเร็จ กรุณาลองใหม่')).toBeInTheDocument()

    setLeaveRequestsScenario('data')
    await user.click(screen.getByRole('button', { name: 'ลองใหม่' }))

    await waitFor(() => {
      expect(screen.getByText('1 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
    })
  })

  it('กดปุ่ม "ยื่นลา" (FAB) ในหน้า balance → navigate ไป /leave/new', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('button', { name: 'ยื่นลา' }))

    expect(await screen.findByText('ยื่นใบลา')).toBeInTheDocument()
  })

  it('กดการ์ดใบลา → navigate ไป /leave/:id', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('วันลาคงเหลือ')
    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))
    const meta = await screen.findByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')

    const card = meta.closest('button')
    expect(card).not.toBeNull()
    if (card) await user.click(card)

    expect(await screen.findByText('รายละเอียดใบลา')).toBeInTheDocument()
  })

  it('เข้าด้วย URL ?tab=pending โดยตรง → แสดงรายการรออนุมัติทันที (restore จาก URL)', async () => {
    renderPage(['/leave?tab=pending'])

    expect(await screen.findByRole('heading', { name: 'รออนุมัติลา' })).toBeInTheDocument()
    expect(await screen.findByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')).toBeInTheDocument()
  })

  it('เข้าด้วย URL ?tab=bogus (ค่าไม่รู้จัก) → whitelist ตกกลับไปหน้า balance', async () => {
    renderPage(['/leave?tab=bogus'])

    expect(await screen.findByText('วันลาคงเหลือ')).toBeInTheDocument()
  })

  it('จาก list → เปิดการ์ด (/leave/:id) → back → ยังอยู่ list เดิม ไม่รีเซ็ตกลับ balance', async () => {
    const user = userEvent.setup()
    const router = renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))
    const meta = await screen.findByText('8 มิ.ย. 2569 · 1 วัน · เต็มวัน')
    const card = meta.closest('button')
    expect(card).not.toBeNull()
    if (card) await user.click(card)
    expect(await screen.findByText('รายละเอียดใบลา')).toBeInTheDocument()

    router.navigate(-1)

    expect(await screen.findByRole('heading', { name: 'รออนุมัติลา' })).toBeInTheDocument()
  })

  it('สลับ pending ↔ history แล้วกด back ครั้งเดียว → กลับไป balance (replace ไม่สะสม entry)', async () => {
    const user = userEvent.setup()
    const router = renderPage()
    await screen.findByText('วันลาคงเหลือ')

    await user.click(screen.getByRole('tab', { name: /ใบลารออนุมัติ/ }))
    await screen.findByRole('heading', { name: 'รออนุมัติลา' })

    await user.click(screen.getByRole('tab', { name: /ประวัติการลาของฉัน/ }))
    await screen.findByRole('heading', { name: 'ประวัติการลาของฉัน' })

    router.navigate(-1)

    expect(await screen.findByText('วันลาคงเหลือ')).toBeInTheDocument()
  })
})
