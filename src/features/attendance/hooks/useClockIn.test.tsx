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
import { useClockIn } from './useClockIn'

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

function countClockInHits(): { get: () => number } {
  let hitCount = 0
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/attendance/clock-in')) hitCount += 1
  })
  return { get: () => hitCount }
}

describe('useClockIn', () => {
  it('สำเร็จ → คืน { date, time, type } ตามที่ server ประทับเวลา (client ไม่ส่ง timestamp เอง)', async () => {
    const { result } = renderHook(() => useClockIn(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ lat: 13.7563, lng: 100.5018, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ date: '2026-07-21', time: '07:50', type: 'onsite' })
  })

  it('OUT_OF_GEOFENCE → onError ได้ ApiError code ตรง (ClockPage ใช้สลับ state ไป out-of-range)', async () => {
    setClockActionScenario('out-of-geofence')
    const { result } = renderHook(() => useClockIn(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ lat: 0, lng: 0, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('OUT_OF_GEOFENCE')
  })

  it('ALREADY_CLOCKED_IN → onError ได้ ApiError code ตรง (ClockPage ใช้ refetch today)', async () => {
    setClockActionScenario('already-clocked-in')
    const { result } = renderHook(() => useClockIn(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ lat: 13.7563, lng: 100.5018, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('ALREADY_CLOCKED_IN')
  })

  it('ไม่ retry อัตโนมัติ (ใช้ query-client จริงของแอป) — ยิงครั้งเดียวแม้เจอ error', async () => {
    setClockActionScenario('out-of-geofence')
    const hits = countClockInHits()

    function AppWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useClockIn(), { wrapper: AppWrapper })

    act(() => {
      result.current.mutate({ lat: 0, lng: 0, accuracy: 15, type: 'onsite' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hits.get()).toBe(1)
  })
})
