import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { queryClient as appQueryClient } from '@/lib/query-client'
import { ApiError } from '@/lib/api-client'
import { leaveHandlers, resetLeaveScenarios, setLeaveCreateScenario } from '@/mocks/handlers/leave'
import type { LeaveCreatePayload } from '@/types/leave'
import { useSubmitLeave } from './useSubmitLeave'

const server = setupServer(...leaveHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetLeaveScenarios()
  appQueryClient.clear()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const PAYLOAD: LeaveCreatePayload = {
  leaveType: 'vacation',
  days: [{ date: '2026-06-19', period: 'full' }],
  reason: 'เดินทางต่างจังหวัดกับครอบครัว',
  substituteId: 'teammate-1',
  attachments: [],
}

function countCreateHits(): { get: () => number } {
  let hitCount = 0
  server.events.on('request:start', ({ request }) => {
    if (request.url.endsWith('/leave/requests') && request.method === 'POST') hitCount += 1
  })
  return { get: () => hitCount }
}

describe('useSubmitLeave', () => {
  it('สำเร็จ → คืน LeaveCreateResult (id/requestNumber/status PENDING ฯลฯ)', async () => {
    const { result } = renderHook(() => useSubmitLeave(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate(PAYLOAD)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('PENDING')
    expect(result.current.data?.type).toBe('vacation')
  })

  it('QUOTA_EXCEEDED → onError ได้ ApiError code ตรง', async () => {
    setLeaveCreateScenario('quota-exceeded')
    const { result } = renderHook(() => useSubmitLeave(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate(PAYLOAD)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('QUOTA_EXCEEDED')
  })

  it('ไม่ retry อัตโนมัติ (ใช้ query-client จริงของแอป) — ยิงครั้งเดียวแม้เจอ error', async () => {
    setLeaveCreateScenario('error')
    const hits = countCreateHits()

    function AppWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useSubmitLeave(), { wrapper: AppWrapper })

    act(() => {
      result.current.mutate(PAYLOAD)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hits.get()).toBe(1)
  })
})
