/**
 * features/attendance/hooks/useGeolocation.ts — ขอพิกัด GPS ตามกฎ LIFF (§15): เรียกจาก user action
 * เท่านั้น (ห้าม auto-request ตอน mount) + retry ลดความแม่นยำตอน timeout + map error 3 code → ข้อความไทย
 *
 * อยู่ใน feature นี้ (ไม่ shared) เพราะข้อความ error ผูก context "กดลงเวลา" ตรง ๆ และยังไม่มี
 * feature อื่นใช้ GPS (§6, §7.3) — ห้าม export ออก `features/attendance/index.ts`
 *
 * ⚠️ ห้าม log พิกัดที่ได้ลง console (ความปลอดภัย — code-style.md)
 */
import { useCallback, useState } from 'react'
import type { LatLng } from '../utils/haversine'

/** ตัวเลือกรอบแรก — แม่นยำสูง, ไม่เอา cache (WebView บางตัว implement เพี้ยนคืนพิกัดเก่า) */
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

/** ตัวเลือก retry รอบสอง — ยอมแม่นน้อยลงเพื่อให้ได้พิกัดเร็วขึ้น (อาการ timeout พบบ่อยบน LINE Android WebView) */
const LOW_ACCURACY_RETRY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 0,
}

function requestPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/** type guard แยก `GeolocationPositionError` (มี `code` เป็นตัวเลข) ออกจาก error ทั่วไป — ไม่ใช้ `as` */
function isGeolocationPositionError(value: unknown): value is GeolocationPositionError {
  if (typeof value !== 'object' || value === null) return false
  if (!('code' in value)) return false
  return typeof value.code === 'number'
}

/**
 * ขอพิกัดปัจจุบัน — ถ้ารอบแรก timeout หรือหา fix ไม่ได้ retry อีกครั้งด้วยความแม่นยำต่ำลง (§15)
 * `PERMISSION_DENIED` ไม่ retry (ผู้ใช้ต้องไปเปิดสิทธิ์เอง กด retry ซ้ำก็ได้ผลเดิม)
 */
export async function getPositionWithRetry(): Promise<GeolocationPosition> {
  if (!('geolocation' in navigator)) {
    throw new Error('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง GPS')
  }

  try {
    return await requestPosition(HIGH_ACCURACY_OPTIONS)
  } catch (error) {
    if (
      isGeolocationPositionError(error) &&
      (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)
    ) {
      return await requestPosition(LOW_ACCURACY_RETRY_OPTIONS)
    }
    throw error
  }
}

/** ข้อความไทยตาม error code — ตารางเดียวกับ architecture.md §15 */
function describeGeolocationError(error: unknown): string {
  if (isGeolocationPositionError(error)) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่งให้แอป LINE ในการตั้งค่าของเครื่อง แล้วลองใหม่'
      case error.POSITION_UNAVAILABLE:
        return 'หาตำแหน่งไม่พบ กรุณาลองขยับไปใกล้หน้าต่างหรือที่โล่ง แล้วกดลงเวลาอีกครั้ง'
      case error.TIMEOUT:
        return 'ค้นหาตำแหน่งไม่สำเร็จ ระบบลองให้อัตโนมัติแล้ว กรุณากดลงเวลาอีกครั้ง'
      default:
        return 'ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง'
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง'
}

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface GeolocationState {
  status: GeolocationStatus
  position: LatLng | null
  accuracy: number | null
  error: string | null
}

const IDLE_STATE: GeolocationState = { status: 'idle', position: null, accuracy: null, error: null }

/** ผลลัพธ์ที่ `request()` คืนตรง ๆ (เพิ่มจาก P11 — P12 ต้องใช้ค่าทันทีในฟังก์ชันเดียวกันที่กด
 * ลงเวลา ก่อน state ด้านล่างจะ re-render มาถึง — ดู handleClockIn ตัวอย่างใน §15) */
export interface GeolocationFix {
  position: LatLng
  accuracy: number
}

export interface UseGeolocationResult extends GeolocationState {
  /** เรียกจาก onClick ของปุ่มเท่านั้น (user action ตามกฎ LIFF §15) — ห้ามเรียกตอน mount
   * คืนพิกัดที่ได้ (หรือ `null` ถ้าเจอ error — error message อ่านจาก state.error ต่อได้ทันที) */
  request: () => Promise<GeolocationFix | null>
}

/** hook ขอพิกัด GPS — ไม่ auto-request ตอน mount, เรียก `request()` จาก user action เท่านั้น */
export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<GeolocationState>(IDLE_STATE)

  const request = useCallback(async (): Promise<GeolocationFix | null> => {
    // คง position/accuracy เดิม (last-known) ไว้ระหว่าง loading/error — กัน UI (หมุด/pill) เด้งหาย
    // ทุกครั้งที่ขอ GPS รอบใหม่ ก่อนหน้านี้ set เป็น null ทันทีทำให้จอกระพริบโดยไม่จำเป็น
    setState((prev) => ({ status: 'loading', position: prev.position, accuracy: prev.accuracy, error: null }))
    try {
      const pos = await getPositionWithRetry()
      const fix: GeolocationFix = {
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        accuracy: pos.coords.accuracy,
      }
      setState({ status: 'success', position: fix.position, accuracy: fix.accuracy, error: null })
      return fix
    } catch (error) {
      setState((prev) => ({
        status: 'error',
        position: prev.position,
        accuracy: prev.accuracy,
        error: describeGeolocationError(error),
      }))
      return null
    }
  }, [])

  return { ...state, request }
}
