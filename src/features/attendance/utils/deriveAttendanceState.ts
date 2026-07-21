/**
 * features/attendance/utils/deriveAttendanceState.ts — pure function แปลง `today` + geofence
 * client preview + การเลือกโหมด remote → 1 ใน 6 state ของ `ClockPage` (feature-plans/02 ตาราง
 * state machine) ไม่มี React/side-effect ใด ๆ — ตัวจริงที่ตัดสิน geofence คือ server เสมอ (§15)
 * ค่า `isWithinRadius` ที่ฟังก์ชันนี้รับเป็นแค่ preview ฝั่ง client (haversine) ใช้จัด UI เท่านั้น
 */
import type { AttendanceToday } from '../types/attendance'

export type AttendanceUiState =
  | 'in-range-ready'
  | 'out-of-range'
  | 'remote-ready'
  | 'clocked-in'
  | 'completed'

export interface DeriveAttendanceStateInput {
  today: AttendanceToday
  /**
   * ผล preview geofence ฝั่ง client — `null` = ยังไม่ทราบตำแหน่ง (ยังไม่เคยกด/ขอ GPS ไม่สำเร็จ)
   * เมื่อยังไม่ทราบ ให้ปุ่มกดได้ก่อน (ตาม §15 ตัวอย่าง handleClockIn — ขอ GPS "ตอนกดปุ่ม" แล้วค่อย
   * รู้ผลจริง ไม่ใช่ disable ปุ่มไว้ก่อนเช็ค)
   */
  isWithinRadius: boolean | null
  /** ผู้ใช้เลือกโหมด "ไปทำงานนอกสถานที่" ไว้แล้วหรือไม่ (RemoteModePill) */
  remoteModeSelected: boolean
}

export function deriveAttendanceState({
  today,
  isWithinRadius,
  remoteModeSelected,
}: DeriveAttendanceStateInput): AttendanceUiState {
  if (today.clockedIn && today.clockedOut) return 'completed'
  if (today.clockedIn) return 'clocked-in'
  if (remoteModeSelected) return 'remote-ready'
  if (isWithinRadius === false) return 'out-of-range'
  return 'in-range-ready'
}
