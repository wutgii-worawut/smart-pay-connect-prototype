import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPositionWithRetry, useGeolocation } from './useGeolocation'

function makePosition(overrides: Partial<GeolocationCoordinates> = {}): GeolocationPosition {
  return {
    coords: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 15,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
      ...overrides,
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  }
}

function makeError(code: 1 | 2 | 3): GeolocationPositionError {
  return {
    code,
    message: 'mock geolocation error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}

describe('getPositionWithRetry', () => {
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

  it('สำเร็จตั้งแต่รอบแรก (ไม่ retry)', async () => {
    const position = makePosition()
    getCurrentPosition.mockImplementation((onSuccess: (p: GeolocationPosition) => void) => {
      onSuccess(position)
    })

    const result = await getPositionWithRetry()

    expect(result).toBe(position)
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: true, maximumAge: 0 })
  })

  it('TIMEOUT รอบแรก → retry รอบสองด้วย enableHighAccuracy:false แล้วสำเร็จ', async () => {
    const position = makePosition()
    let callCount = 0
    getCurrentPosition.mockImplementation(
      (
        onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        callCount += 1
        if (callCount === 1) {
          onError(makeError(3))
        } else {
          onSuccess(position)
        }
      },
    )

    const result = await getPositionWithRetry()

    expect(result).toBe(position)
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
    expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({ enableHighAccuracy: false, maximumAge: 0 })
  })

  it('POSITION_UNAVAILABLE รอบแรก → retry รอบสองเช่นกัน', async () => {
    const position = makePosition()
    let callCount = 0
    getCurrentPosition.mockImplementation(
      (
        onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        callCount += 1
        if (callCount === 1) {
          onError(makeError(2))
        } else {
          onSuccess(position)
        }
      },
    )

    const result = await getPositionWithRetry()
    expect(result).toBe(position)
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('PERMISSION_DENIED ไม่ retry — โยน error ทันที', async () => {
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        onError(makeError(1))
      },
    )

    await expect(getPositionWithRetry()).rejects.toMatchObject({ code: 1 })
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('retry รอบสองยังล้มเหลว → โยน error ของรอบสอง', async () => {
    let callCount = 0
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        callCount += 1
        onError(makeError(callCount === 1 ? 3 : 2))
      },
    )

    await expect(getPositionWithRetry()).rejects.toMatchObject({ code: 2 })
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('อุปกรณ์ไม่รองรับ GPS → โยน error ข้อความไทยโดยไม่เรียก getCurrentPosition', async () => {
    // ลบ property ออกจริง (ไม่ใช่แค่ตั้งเป็น undefined) เพื่อจำลอง `'geolocation' in navigator` เป็น false
    // ตรงกับอุปกรณ์ที่ไม่รองรับจริง (property ไม่ถูกประกาศเลย)
    Reflect.deleteProperty(navigator, 'geolocation')

    await expect(getPositionWithRetry()).rejects.toThrow('ไม่รองรับการระบุตำแหน่ง')
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })
})

describe('useGeolocation', () => {
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

  it('เริ่มต้นที่ status idle และไม่เรียก GPS จนกว่าจะสั่ง request() (ห้าม auto-request ตอน mount, §15)', () => {
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.status).toBe('idle')
    expect(result.current.position).toBeNull()
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('request() สำเร็จ → status success พร้อมพิกัดและ accuracy', async () => {
    getCurrentPosition.mockImplementation((onSuccess: (p: GeolocationPosition) => void) => {
      onSuccess(makePosition({ latitude: 13.7, longitude: 100.5, accuracy: 20 }))
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.position).toEqual({ lat: 13.7, lng: 100.5 })
    expect(result.current.accuracy).toBe(20)
    expect(result.current.error).toBeNull()
  })

  it('request() เจอ PERMISSION_DENIED → status error พร้อมข้อความไทยแนะนำเปิดสิทธิ์', async () => {
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        onError(makeError(1))
      },
    )

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toContain('เปิดสิทธิ์')
  })

  it('request() เจอ POSITION_UNAVAILABLE → ข้อความไทยแนะนำขยับที่โล่ง', async () => {
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        onError(makeError(2))
      },
    )

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toContain('ที่โล่ง')
  })

  it('request() เจอ TIMEOUT ทั้งสองรอบ → ข้อความไทยแจ้งให้ลองกดใหม่', async () => {
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        onError(makeError(3))
      },
    )

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
    expect(result.current.error).toContain('กดลงเวลาอีกครั้ง')
  })

  it('request() สำเร็จ → คืนค่า GeolocationFix ตรงในฟังก์ชันเดียวกัน (P12 ใช้ตัดสิน geofence ทันที ไม่ต้องรอ re-render)', async () => {
    getCurrentPosition.mockImplementation((onSuccess: (p: GeolocationPosition) => void) => {
      onSuccess(makePosition({ latitude: 13.7, longitude: 100.5, accuracy: 25 }))
    })

    const { result } = renderHook(() => useGeolocation())

    let fix: Awaited<ReturnType<typeof result.current.request>> = null
    await act(async () => {
      fix = await result.current.request()
    })

    expect(fix).toEqual({ position: { lat: 13.7, lng: 100.5 }, accuracy: 25 })
  })

  it('request() ล้มเหลว → คืน null (ไม่ throw) เผื่อ caller เช็ค falsy แล้วหยุด flow ต่อได้ทันที', async () => {
    getCurrentPosition.mockImplementation(
      (
        _onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        onError(makeError(1))
      },
    )

    const { result } = renderHook(() => useGeolocation())

    let fix: Awaited<ReturnType<typeof result.current.request>> = null
    await act(async () => {
      fix = await result.current.request()
    })

    expect(fix).toBeNull()
  })

  it('request() รอบสองล้มเหลว → คง position/accuracy รอบแรก (last-known) ไว้ ไม่เด้งเป็น null (F4)', async () => {
    let callCount = 0
    getCurrentPosition.mockImplementation(
      (
        onSuccess: (p: GeolocationPosition) => void,
        onError: (e: GeolocationPositionError) => void,
      ) => {
        callCount += 1
        if (callCount === 1) {
          onSuccess(makePosition({ latitude: 13.7, longitude: 100.5, accuracy: 20 }))
        } else {
          onError(makeError(2))
        }
      },
    )

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })
    expect(result.current.position).toEqual({ lat: 13.7, lng: 100.5 })

    await act(async () => {
      await result.current.request()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.position).toEqual({ lat: 13.7, lng: 100.5 })
    expect(result.current.accuracy).toBe(20)
  })
})
