import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppToaster } from '@/components/Toaster'
import { attendanceHandlers, resetAttendanceScenarios } from '@/mocks/handlers/attendance'
import { ClockPage } from './ClockPage'

/**
 * jsdom ไม่มี WebGL จริง — MapLibre init ของจริงใน MapView โยน "Failed to initialize WebGL" ทันที
 * ทำให้ทั้งหน้าเด้ง error boundary ก่อนถึงเนื้อหาที่ต้องเทสต์ (ปุ่มลงเวลา/pill) — mock module นี้เป็น
 * fake ขั้นต่ำที่ครบ method ที่ `MapView.tsx` เรียกจริง (on/off/addSource/addLayer/panTo/remove,
 * Marker.setLngLat/addTo/remove) เพื่อให้ status ไปถึง 'ready' ได้โดยไม่แตะ WebGL จริง
 */
vi.mock('maplibre-gl', () => {
  class FakeMap {
    private loadCallback: (() => void) | null = null
    on(event: string, callback: () => void) {
      if (event === 'load') {
        this.loadCallback = callback
        queueMicrotask(() => this.loadCallback?.())
      }
    }
    off() {}
    addSource() {}
    addLayer() {}
    panTo() {}
    remove() {}
  }
  class FakeMarker {
    setLngLat() {
      return this
    }
    addTo() {
      return this
    }
    remove() {}
  }
  return { Map: FakeMap, Marker: FakeMarker }
})

const server = setupServer(...attendanceHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetAttendanceScenarios()
})
afterAll(() => server.close())

function makePosition(latitude: number, longitude: number, accuracy = 15): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  })
  const router = createMemoryRouter(
    [
      {
        path: '/attendance',
        element: (
          <>
            <AppToaster />
            <ClockPage />
          </>
        ),
      },
      { path: '/attendance/history', element: <p>ประวัติลงเวลา</p> },
      { path: '/', element: <p>หน้าหลัก</p> },
    ],
    { initialEntries: ['/attendance'] },
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ClockPage', () => {
  let getCurrentPosition: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
  })

  it('F2: กดลงเวลาระหว่างรอผล GPS (ยังไม่ resolve) → ปุ่มลงเวลากลาย disabled กันกดซ้ำสองครั้ง', async () => {
    // ไม่เรียก onSuccess/onError เลย จำลอง GPS ที่ยังไม่ตอบกลับ (ระหว่าง 10-25s ของ retry จริง)
    getCurrentPosition.mockImplementation(() => {})

    const user = userEvent.setup()
    renderPage()

    const clockButton = await screen.findByRole('button', { name: 'เข้างาน' })
    expect(clockButton).toBeEnabled()

    await user.click(clockButton)

    await waitFor(() => expect(clockButton).toBeDisabled())
  })

  it('F5: canRemoteClock=false + ตำแหน่งนอกรัศมี → ไม่โชว์ pill "ไปทำงานนอกสถานที่" (เหลือแค่ pill แดง)', async () => {
    server.use(
      http.get('/attendance/today', () =>
        HttpResponse.json({
          data: {
            clockedIn: false,
            clockedOut: false,
            clockInTime: null,
            clockOutTime: null,
            clockInType: null,
            office: {
              lat: 13.7563,
              lng: 100.5018,
              radiusMeters: 200,
              name: 'บริษัท คอมพิวเตอร์ จำกัด',
            },
            canRemoteClock: false,
            date: '2026-07-21',
          },
        }),
      ),
    )
    // พิกัดไกลจากออฟฟิศมาก (0,0) → client preview คำนวณว่านอกรัศมีแน่นอน
    getCurrentPosition.mockImplementation((onSuccess: (p: GeolocationPosition) => void) => {
      onSuccess(makePosition(0, 0))
    })

    const user = userEvent.setup()
    renderPage()

    const clockButton = await screen.findByRole('button', { name: 'เข้างาน' })
    await user.click(clockButton)

    await waitFor(() => {
      expect(screen.getByText('อยู่นอกรัศมี')).toBeInTheDocument()
    })
    expect(screen.queryByText('ไปทำงานนอกสถานที่')).not.toBeInTheDocument()
  })
})
