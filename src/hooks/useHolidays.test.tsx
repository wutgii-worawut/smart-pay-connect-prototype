import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { calendarHandlers } from '@/mocks/handlers/calendar'
import { useHolidays } from './useHolidays'

const server = setupServer(...calendarHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useHolidays', () => {
  it('เป็นแค่ thin wrapper ของ GET /holidays?year= — คืนค่า Holiday[] ตรงตามที่ mock ส่งมา ไม่แปลง/นับอะไรเพิ่ม', async () => {
    server.use(
      http.get('*/holidays', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('year')).toBe('2026')
        return HttpResponse.json({
          data: [
            { date: '2026-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival', type: 'government' },
            { date: '2026-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival', type: 'government' },
          ],
        })
      }),
    )

    const { result } = renderHook(() => useHolidays(2026), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { date: '2026-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival', type: 'government' },
      { date: '2026-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival', type: 'government' },
    ])
  })

  it('default mock (mock ยังไม่มีข้อมูลปีที่ขอ) → คืน array ว่าง ไม่ crash', async () => {
    const { result } = renderHook(() => useHolidays(2027), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
