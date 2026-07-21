/**
 * features/attendance/hooks/useAttendanceState.ts — hook บาง ๆ ห่อ `deriveAttendanceState` (utils,
 * pure) + เก็บ state ที่ผู้ใช้เลือกโหมด "ไปทำงานนอกสถานที่" (RemoteModePill) ไว้ในตัว —
 * ไม่มี logic นับ/ตัดสินอะไรอยู่ในไฟล์นี้เอง (ตามกติกา pure function → utils, ห้ามห่อ logic ในเลย์นี้)
 */
import { useCallback, useMemo, useState } from 'react'
import { deriveAttendanceState, type AttendanceUiState } from '../utils/deriveAttendanceState'
import type { AttendanceToday } from '../types/attendance'

export interface UseAttendanceStateResult {
  state: AttendanceUiState
  remoteModeSelected: boolean
  /** ผู้ใช้แตะ RemoteModePill ตอน out-of-range → สลับเข้าโหมด remote-ready */
  selectRemoteMode: () => void
  /** ล้างโหมด remote (เช่น กด "โหลดแผนที่ใหม่" หรือหลังลงเวลาสำเร็จ) */
  clearRemoteMode: () => void
}

/**
 * `today` เป็น `undefined` ระหว่าง query ยังโหลดไม่เสร็จ — คืน 'in-range-ready' เป็นค่า placeholder
 * เฉย ๆ (ClockPage เป็นคนตัดสินใจไม่ render dock/ปุ่มจนกว่า query จะสำเร็จอยู่แล้ว ไม่ได้พึ่งค่านี้)
 */
export function useAttendanceState(
  today: AttendanceToday | undefined,
  isWithinRadius: boolean | null,
): UseAttendanceStateResult {
  const [remoteModeSelected, setRemoteModeSelected] = useState(false)

  const state = useMemo<AttendanceUiState>(() => {
    if (!today) return 'in-range-ready'
    return deriveAttendanceState({ today, isWithinRadius, remoteModeSelected })
  }, [today, isWithinRadius, remoteModeSelected])

  const selectRemoteMode = useCallback(() => setRemoteModeSelected(true), [])
  const clearRemoteMode = useCallback(() => setRemoteModeSelected(false), [])

  return { state, remoteModeSelected, selectRemoteMode, clearRemoteMode }
}
