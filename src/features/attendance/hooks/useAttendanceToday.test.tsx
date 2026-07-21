import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import {
  attendanceHandlers,
  resetAttendanceScenarios,
  setAttendanceTodayScenario,
} from '@/mocks/handlers/attendance'
import { useAttendanceToday } from './useAttendanceToday'

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetAttendanceScenarios()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAttendanceToday', () => {
  it('not-clocked-in (default) → clockedIn=false, canRemoteClock=true, มี office.name', async () => {
    const { result } = renderHook(() => useAttendanceToday(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.clockedIn).toBe(false)
    expect(result.current.data?.canRemoteClock).toBe(true)
    expect(result.current.data?.office.name).toBe('บริษัท คอมพิวเตอร์ จำกัด')
  })

  it('clocked-in-remote → clockInType=remote, office มี address (ใช้แสดงในไทม์ไลน์สำเร็จ)', async () => {
    setAttendanceTodayScenario('clocked-in-remote')
    const { result } = renderHook(() => useAttendanceToday(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.clockInType).toBe('remote')
    expect(result.current.data?.office.address).toBeDefined()
  })
})
