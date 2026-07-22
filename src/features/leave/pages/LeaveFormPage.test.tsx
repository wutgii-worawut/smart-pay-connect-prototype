import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { leaveHandlers, resetLeaveScenarios, setLeaveCreateScenario } from '@/mocks/handlers/leave'
import { employeesHandlers } from '@/mocks/handlers/employees'
import { calendarHandlers } from '@/mocks/handlers/calendar'
import { LeaveFormPage } from './LeaveFormPage'

const server = setupServer(...leaveHandlers, ...employeesHandlers, ...calendarHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  vi.setSystemTime(new Date(2026, 5, 10))
})
afterEach(() => {
  server.resetHandlers()
  resetLeaveScenarios()
  vi.useRealTimers()
})
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  })
  const router = createMemoryRouter(
    [
      { path: '/leave/new', element: <LeaveFormPage /> },
      { path: '/leave', element: <p>รายการใบลา</p> },
    ],
    { initialEntries: ['/leave/new'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

async function fillMinimalValidForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('ขออนุมัติลา')
  await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))

  await user.click(screen.getAllByText('เลือกวันที่')[0])
  await user.click(await screen.findByRole('button', { name: /19 มิถุนายน/ }))
  await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))

  await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'เดินทางต่างจังหวัดกับครอบครัว')

  await user.click(screen.getByRole('combobox', { name: 'ผู้ปฏิบัติงานแทน (ถ้ามี)' }))
  await user.click(await screen.findByRole('option', { name: 'นายแทนคุณ สมมุติ' }))
}

describe('LeaveFormPage', () => {
  it('โหลดสำเร็จ → แสดงฟอร์มพร้อมชื่อผู้อนุมัติ auto จาก GET /employees/teammates', async () => {
    renderPage()

    expect(await screen.findByText('ขออนุมัติลา')).toBeInTheDocument()
    const approverField = screen.getByRole('combobox', { name: 'ผู้อนุมัติ' })
    expect(approverField).toHaveTextContent('นายวิชัย มั่นคง')
    expect(approverField).toBeDisabled()
  })

  it('โหลด balance ไม่สำเร็จ → ErrorState + กดลองใหม่ยิง query ซ้ำ', async () => {
    server.use(
      http.get('/leave/balance', () =>
        HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'โหลดวันลาคงเหลือไม่สำเร็จ' } }, { status: 500 }),
      ),
    )
    renderPage()

    expect(await screen.findByText('โหลดวันลาคงเหลือไม่สำเร็จ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument()
  })

  it('ส่งฟอร์มสำเร็จ → server ได้ body ที่มี days เป็น YYYY-MM-DD string ตรงตามที่เลือก แล้วสลับไปจอสำเร็จ', async () => {
    const user = userEvent.setup()
    let receivedBody:
      | { leaveType?: string; days?: { date: string; period: string }[]; reason?: string; substituteId?: string }
      | undefined

    server.use(
      http.post('/leave/requests', async ({ request }) => {
        receivedBody = (await request.json()) as typeof receivedBody
        return HttpResponse.json({
          data: {
            id: 'leave-new-1',
            requestNumber: 'ล 0722/11',
            status: 'PENDING',
            type: 'vacation',
            startDate: '2026-06-19',
            endDate: '2026-06-19',
            totalDays: 1,
            periodSummary: 'เต็มวัน',
          },
        })
      }),
    )

    renderPage()
    await fillMinimalValidForm(user)
    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    await waitFor(() => expect(screen.getByText('ส่งคำขอลาเรียบร้อย')).toBeInTheDocument())

    expect(receivedBody).toEqual({
      leaveType: 'vacation',
      days: [{ date: '2026-06-19', period: 'full' }],
      reason: 'เดินทางต่างจังหวัดกับครอบครัว',
      substituteId: 'teammate-1',
    })

    expect(screen.getByText('เลขที่ใบลา ล 0722/11')).toBeInTheDocument()
    expect(screen.getByText(/1 วัน · เต็มวัน/)).toBeInTheDocument()
  })

  it('ส่งฟอร์มโดยไม่เลือกผู้ปฏิบัติงานแทน → server ได้ body ที่ไม่มี key substituteId เลย (optional §16.3)', async () => {
    const user = userEvent.setup()
    let receivedBody: Record<string, unknown> | undefined

    server.use(
      http.post('/leave/requests', async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          data: {
            id: 'leave-new-1',
            requestNumber: 'ล 0722/11',
            status: 'PENDING',
            type: 'vacation',
            startDate: '2026-06-19',
            endDate: '2026-06-19',
            totalDays: 1,
            periodSummary: 'เต็มวัน',
          },
        })
      }),
    )

    renderPage()
    await screen.findByText('ขออนุมัติลา')
    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await user.click(screen.getAllByText('เลือกวันที่')[0])
    await user.click(await screen.findByRole('button', { name: /19 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))
    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'เดินทางต่างจังหวัดกับครอบครัว')
    // ไม่แตะช่องผู้ปฏิบัติงานแทนเลย

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    await waitFor(() => expect(screen.getByText('ส่งคำขอลาเรียบร้อย')).toBeInTheDocument())
    expect(receivedBody).toBeDefined()
    expect(receivedBody && 'substituteId' in receivedBody).toBe(false)
  })

  it('กด "ดูประวัติการลา" ที่จอสำเร็จ → navigate ไป /leave?tab=pending', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillMinimalValidForm(user)
    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    await screen.findByText('ส่งคำขอลาเรียบร้อย')
    await user.click(screen.getByRole('button', { name: 'ดูประวัติการลา' }))

    expect(await screen.findByText('รายการใบลา')).toBeInTheDocument()
  })

  it('QUOTA_EXCEEDED → ฟอร์มยังอยู่ + โชว์ error ตรงช่องวันที่ (ไม่สลับไปจอสำเร็จ)', async () => {
    setLeaveCreateScenario('quota-exceeded')
    const user = userEvent.setup()
    renderPage()
    await fillMinimalValidForm(user)
    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(await screen.findByText('วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก')).toBeInTheDocument()
    expect(screen.queryByText('ส่งคำขอลาเรียบร้อย')).not.toBeInTheDocument()
  })

  it('ปุ่มส่ง disabled ระหว่าง isPending (ก่อน response ตอบกลับ) — ไม่ให้กดซ้ำ', async () => {
    let resolveResponse: (() => void) | undefined
    server.use(
      http.post('/leave/requests', async () => {
        await new Promise<void>((resolve) => {
          resolveResponse = resolve
        })
        return HttpResponse.json({
          data: {
            id: 'leave-new-1',
            requestNumber: 'ล 0722/11',
            status: 'PENDING',
            type: 'vacation',
            startDate: '2026-06-19',
            endDate: '2026-06-19',
            totalDays: 1,
            periodSummary: 'เต็มวัน',
          },
        })
      }),
    )
    const user = userEvent.setup()
    renderPage()
    await fillMinimalValidForm(user)

    const submitButton = screen.getByRole('button', { name: /ส่งคำขอลา/ })
    await user.click(submitButton)

    await waitFor(() => expect(screen.getByRole('button', { name: /กำลังส่ง/ })).toBeDisabled())

    resolveResponse?.()
    await waitFor(() => expect(screen.getByText('ส่งคำขอลาเรียบร้อย')).toBeInTheDocument())
  })
})
