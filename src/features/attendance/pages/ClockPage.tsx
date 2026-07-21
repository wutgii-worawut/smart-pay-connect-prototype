/**
 * features/attendance/pages/ClockPage.tsx — route `/attendance` (จอ 0-9, feature-plans/02)
 *
 * ⚠️ ทำไมไม่มี ProfileBar (S15) ในไฟล์นี้: ProfileBar ต้องการชื่อพนักงานจาก `features/auth` แต่
 * กฎเหล็ก §6 ห้าม cross-feature import — compose ที่ `app/AttendanceRoute.tsx` แทน (ตามกฎ "compose
 * ที่ app/ หรือ page level") ไฟล์นี้จึงโฟกัสแค่แผนที่+state machine ของ attendance เอง
 *
 * GPS (§15 "ต้องเรียกจาก user action เท่านั้น ห้ามเรียกตอน page load"): ไม่มี auto-request ตอน
 * mount ปุ่มหลัก (ClockButton) เป็นตัวเรียก `geo.request()` ตรงตามตัวอย่าง handleClockIn ใน §15 —
 * ครั้งแรกที่ผู้ใช้กด ระบบขอ GPS แล้วค่อยรู้ผล in-range/out-of-range จริง (ก่อนหน้านั้นปุ่มแสดงผล
 * เป็น in-range-ready ไปก่อนเป็นค่า default ตาม `deriveAttendanceState`)
 *
 * server เป็นผู้ตัดสิน geofence จริงเสมอ (§15) — ถ้า client คิดว่าในรัศมีแต่ server ตอบ
 * `OUT_OF_GEOFENCE` กลับมา จะบังคับสลับ UI เป็น out-of-range ทันที (geofenceOverride)
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { toastError, toastSuccess } from '@/components/toast'
import { ApiError } from '@/lib/api-client'
import { useAttendanceToday } from '../hooks/useAttendanceToday'
import { useAttendanceState } from '../hooks/useAttendanceState'
import { useClockIn } from '../hooks/useClockIn'
import { useClockOut } from '../hooks/useClockOut'
import { useGeolocation, type GeolocationFix } from '../hooks/useGeolocation'
import { isWithinRadius } from '../utils/haversine'
import { isAccuracyDegraded } from '../utils/accuracyGuard'
import { MapView } from '../components/MapView'
import { ClockDock } from '../components/ClockDock'
import { RangeStatusPill } from '../components/RangeStatusPill'
import { RemoteModePill } from '../components/RemoteModePill'
import { RemoteReasonSheet } from '../components/RemoteReasonSheet'
import { ClockSuccessOverlay, type ClockSuccessEntry } from '../components/ClockSuccessOverlay'
import type { ClockRequestPayload, ClockType } from '../types/attendance'

interface SuccessResult {
  action: 'clock-in' | 'clock-out'
  date: string
  time: string
  type: ClockType
}

export function ClockPage() {
  const navigate = useNavigate()

  const { data: today, isLoading, isError, error, refetch } = useAttendanceToday()
  const geo = useGeolocation()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

  const [geofenceOverride, setGeofenceOverride] = useState<'out-of-range' | null>(null)
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false)
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null)

  const clientWithinRadius = today && geo.position
    ? isWithinRadius(geo.position, today.office, today.office.radiusMeters)
    : null
  const effectiveWithinRadius = geofenceOverride === 'out-of-range' ? false : clientWithinRadius

  const { state, remoteModeSelected, selectRemoteMode, clearRemoteMode } = useAttendanceState(
    today,
    effectiveWithinRadius,
  )

  // F2: รวมสถานะรอ GPS (~10-25s รวม retry) เข้ากับ isPending ด้วย — flow เดิมกด→await GPS→mutate
  // ทำให้กดปุ่มซ้ำระหว่างรอ GPS ได้ (ยังไม่ทัน mutate) → ยิง POST ซ้ำสองครั้ง
  const isPending = clockInMutation.isPending || clockOutMutation.isPending || geo.status === 'loading'

  // แจ้ง error ของ GPS ผ่าน toast (ไม่ทับ ErrorState ของ query — คนละสาเหตุ)
  useEffect(() => {
    if (geo.status === 'error' && geo.error) {
      toastError(geo.error)
    }
  }, [geo.status, geo.error])

  async function requestFreshPosition(): Promise<GeolocationFix | null> {
    setGeofenceOverride(null)
    return geo.request()
  }

  function handleClockSuccess(action: 'clock-in' | 'clock-out', type: ClockType) {
    return (response: { date: string; time: string; type: ClockType }) => {
      setSuccessResult({ action, date: response.date, time: response.time, type })
      setGeofenceOverride(null)
      clearRemoteMode()
      toastSuccess(
        `${action === 'clock-in' ? 'ลงเวลาเข้าสำเร็จ' : 'ลงเวลาออกสำเร็จ'} เวลา ${response.time} น.`,
      )
    }
  }

  function handleClockError(err: unknown) {
    if (!(err instanceof ApiError)) {
      toastError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      return
    }
    if (err.code === 'OUT_OF_GEOFENCE') {
      setGeofenceOverride('out-of-range')
      clearRemoteMode()
      toastError(err.message)
      return
    }
    if (err.code === 'ALREADY_CLOCKED_IN' || err.code === 'NOT_CLOCKED_IN') {
      toastError(err.message)
      void refetch()
      return
    }
    toastError(err.message)
  }

  async function handleClockAction() {
    if (!today) return

    // เข้าแล้ว ยังไม่ออก → ลงเวลาออกด้วย type เดียวกับตอนเข้า (session เดียวกัน — ไม่ขอเหตุผลซ้ำ)
    if (today.clockedIn && !today.clockedOut) {
      const fix = await requestFreshPosition()
      if (!fix) return
      const payload: ClockRequestPayload = {
        lat: fix.position.lat,
        lng: fix.position.lng,
        accuracy: fix.accuracy,
        type: today.clockInType ?? 'onsite',
      }
      clockOutMutation.mutate(payload, {
        onSuccess: handleClockSuccess('clock-out', payload.type),
        onError: handleClockError,
      })
      return
    }

    // เลือกโหมดนอกสถานที่ไว้แล้ว → เปิดกรอกเหตุผลก่อน (ขอ GPS ตอนกดยืนยันในชีท)
    if (remoteModeSelected) {
      setReasonSheetOpen(true)
      return
    }

    // ความพยายามลงเวลาเข้าแบบ onsite — ขอ GPS ตอนกดปุ่มนี้เอง (§15)
    const fix = await requestFreshPosition()
    if (!fix) return

    // §15 "UX เมื่อสัญญาณ GPS แย่": accuracy แย่เกินเกณฑ์ (มากกว่ารัศมี หรือ >100 ม.) อาจทำให้พิกัด
    // "หลุดออกนอกรัศมี" ทั้งที่ยืนอยู่ในออฟฟิศจริง — เตือนก่อนเสมอ ไม่ปล่อยให้กดยืนยันเงียบ ๆ
    if (isAccuracyDegraded(fix.accuracy, today.office.radiusMeters)) {
      toastError(
        `สัญญาณตำแหน่งไม่แม่นยำ (คลาดเคลื่อนประมาณ ±${Math.round(fix.accuracy)} เมตร) กรุณาขยับไปใกล้หน้าต่างหรือที่โล่ง แล้วกดโหลดแผนที่ใหม่`,
      )
    }

    const withinRadius = isWithinRadius(fix.position, today.office, today.office.radiusMeters)
    if (!withinRadius) {
      // client preview บอกว่านอกรัศมี — ไม่ยิง API ปล่อยให้ state เปลี่ยนเป็น out-of-range เอง
      // (geo.position อัปเดตแล้วผ่าน setState ใน hook ทำให้ effectiveWithinRadius คำนวณใหม่) — F3:
      // ต้องแจ้งผู้ใช้ด้วย toast (ไม่เงียบ) พร้อมชี้ทางไปกดปุ่ม "ไปทำงานนอกสถานที่"
      toastError(
        'ตำแหน่งของคุณอยู่นอกรัศมีที่กำหนด (โดยประมาณ) หากต้องทำงานนอกสถานที่ กดปุ่ม "ไปทำงานนอกสถานที่" เพื่อลงเวลา',
      )
      return
    }

    clockInMutation.mutate(
      { lat: fix.position.lat, lng: fix.position.lng, accuracy: fix.accuracy, type: 'onsite' },
      { onSuccess: handleClockSuccess('clock-in', 'onsite'), onError: handleClockError },
    )
  }

  async function handleSubmitRemoteReason(reason: string) {
    if (!today) return
    const fix = await requestFreshPosition()
    if (!fix) return

    clockInMutation.mutate(
      {
        lat: fix.position.lat,
        lng: fix.position.lng,
        accuracy: fix.accuracy,
        type: 'remote',
        remoteReason: reason,
      },
      {
        onSuccess: (response) => {
          setReasonSheetOpen(false)
          handleClockSuccess('clock-in', 'remote')(response)
        },
        onError: handleClockError,
      },
    )
  }

  function handleSelectRemoteMode() {
    selectRemoteMode()
  }

  function handleReloadMap() {
    void requestFreshPosition()
  }

  function handleHistory() {
    navigate('/attendance/history')
  }

  function handleBackHome() {
    setSuccessResult(null)
    navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 border-primary" />
      </div>
    )
  }

  if (isError || !today) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState
          message={error instanceof ApiError ? error.message : 'โหลดข้อมูลลงเวลาไม่สำเร็จ'}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  /**
   * pill มุมขวาบน — จับคู่ตาม design จริง (feature-plans/02 + จอ 0/1/3/5/6/8):
   * out-of-range/remote-ready = คู่ pill (remote + แดงนอกรัศมี); onsite ready/clocked-in/completed =
   * pill เขียวเดี่ยว; ลงเวลาแบบ remote แล้ว (clocked-in/completed ที่ clockInType==='remote') ยังโชว์
   * คู่ pill เดิมต่อ (จอ 8) ไม่กลับไปเขียวเดี่ยวเพราะ session ยังเป็น remote อยู่
   */
  function renderStatusPills() {
    // ผ่าน guard `isError || !today` ด้านบนมาแล้วเสมอตอนถูกเรียก (JSX ท้ายฟังก์ชัน) — เช็คซ้ำ
    // เฉพาะให้ TS narrow `today` ในนี้ (closure ของ function declaration ไม่สืบทอด narrowing เอง)
    if (!today) return null
    if (state === 'out-of-range') {
      // F5: `canRemoteClock=false` (ปิดสิทธิ์ลงเวลานอกสถานที่ต่อพนักงาน, §23.1#4) → ไม่โชว์ pill
      // ทางเลือก "ไปทำงานนอกสถานที่" เลย เหลือแค่ pill แดงบอกสถานะ
      if (!today.canRemoteClock) {
        return <RangeStatusPill status="out-of-range" />
      }
      return (
        <>
          <RemoteModePill active={false} onClick={handleSelectRemoteMode} />
          <RangeStatusPill status="out-of-range" />
        </>
      )
    }
    if (state === 'remote-ready') {
      return (
        <>
          <RemoteModePill active disabled />
          <RangeStatusPill status="out-of-range" />
        </>
      )
    }
    if ((state === 'clocked-in' || state === 'completed') && today.clockInType === 'remote') {
      return (
        <>
          <RemoteModePill active disabled />
          <RangeStatusPill status="out-of-range" />
        </>
      )
    }
    return <RangeStatusPill status="in-range" />
  }

  const entries: ClockSuccessEntry[] = []
  if (successResult) {
    if (successResult.action === 'clock-out' && today.clockInTime) {
      entries.push({
        time: today.clockInTime,
        type: successResult.type,
        locationLabel: today.office.name,
        addressLabel: successResult.type === 'remote' ? today.office.address : undefined,
      })
    }
    entries.push({
      time: successResult.time,
      type: successResult.type,
      locationLabel: today.office.name,
      addressLabel: successResult.type === 'remote' ? today.office.address : undefined,
    })
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <MapView
          userPos={geo.position}
          officePos={today.office}
          radiusMeters={today.office.radiusMeters}
          className="absolute inset-0"
        />

        <div className="absolute top-4 right-4 left-4 flex flex-wrap items-center justify-end gap-2">
          {renderStatusPills()}
        </div>
      </div>

      <ClockDock
        state={state}
        isPending={isPending}
        onClockAction={() => void handleClockAction()}
        onHistory={handleHistory}
        onReloadMap={handleReloadMap}
      />

      <RemoteReasonSheet
        open={reasonSheetOpen}
        onOpenChange={setReasonSheetOpen}
        onSubmitReason={(reason) => void handleSubmitRemoteReason(reason)}
        isPending={isPending}
      />

      {successResult ? (
        <ClockSuccessOverlay
          title={successResult.action === 'clock-in' ? 'ลงเวลาเข้าสำเร็จ' : 'ลงเวลาออกสำเร็จ'}
          date={successResult.date}
          time={successResult.time}
          entries={entries}
          onBackHome={handleBackHome}
        />
      ) : null}
    </div>
  )
}
