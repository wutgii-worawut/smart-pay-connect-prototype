import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { queryClient as appQueryClient } from '@/lib/query-client'
import { ApiError } from '@/lib/api-client'
import {
  attendanceHandlers,
  resetAttendanceScenarios,
  setClockActionScenario,
} from '@/mocks/handlers/attendance'
import { useClockOut } from './useClockOut'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetAttendanceScenarios()
  appQueryClient.clear()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useClockOut', () => {
  it('สำเร็จ → คืน { date, time, type } ตามที่ server ประทับเวลา', async () => {
    const { result } = renderHook(() => useClockOut(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ lat: 13.7563, lng: 100.5018, accuracy: 15, type: 'remote' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ date: '2026-07-21', time: '17:05', type: 'remote' })
  })

  it('NOT_CLOCKED_IN (ยังไม่เข้างาน) → onError ได้ ApiError code ตรง (ClockPage refetch today)', async () => {
    setClockActionScenario('already-clocked-in')
    const { result } = renderHook(() => useClockOut(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ lat: 13.7563, lng: 100.5018, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('NOT_CLOCKED_IN')
  })

  it('ไม่ retry อัตโนมัติ (ใช้ query-client จริงของแอป) — ยิงครั้งเดียวแม้เจอ error', async () => {
    setClockActionScenario('out-of-geofence')
    let hitCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/attendance/clock-out')) hitCount += 1
    })

    function AppWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useClockOut(), { wrapper: AppWrapper })

    act(() => {
      result.current.mutate({ lat: 0, lng: 0, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hitCount).toBe(1)
  })
})
