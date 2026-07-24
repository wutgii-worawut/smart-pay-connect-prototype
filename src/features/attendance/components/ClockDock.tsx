/**
 * features/attendance/components/ClockDock.tsx — แถบล่างจอลงเวลา (feature-plans/02): ปุ่ม
 * "ประวัติลงเวลา" ซ้าย / ClockButton วงกลมใหญ่กลาง (ล้ำขึ้นไปคาบเกี่ยวแผนที่ตาม design) /
 * "โหลดแผนที่ใหม่" ขวา
 *
 * "โหลดแผนที่ใหม่" = ขอ GPS ใหม่ + panTo บน instance เดิมเท่านั้น (§15 "กติกาการใช้แผนที่") —
 * ห้าม re-init MapView ปุ่มนี้แค่เรียก `onReloadMap` callback ที่ ClockPage เป็นคนสั่ง geo.request()
 */
import type { AttendanceUiState } from '../utils/deriveAttendanceState'
import { ClockButton } from './ClockButton'

interface ClockDockProps {
  state: AttendanceUiState
  isPending: boolean
  onClockAction: () => void
  onHistory: () => void
  onReloadMap: () => void
}

function HistoryIcon() {
  // ไอคอนประวัติ (Figma 2026-07-23) — currentColor = #434343 (dock ใช้ text-caption)
  return (
    <svg viewBox="0 0 105 90" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        d="M60 0C35.15 0 15 20.15 15 45H0L19.45 64.45L19.8 65.15L40 45H25C25 25.65 40.65 10 60 10C79.35 10 95 25.65 95 45C95 64.35 79.35 80 60 80C50.35 80 41.6 76.05 35.3 69.7L28.2 76.8C36.35 84.95 47.55 90 60 90C84.85 90 105 69.85 105 45C105 20.15 84.85 0 60 0ZM55 25V50L76.25 62.6L80.1 56.2L62.5 45.75V25H55Z"
      />
    </svg>
  )
}

function ReloadIcon() {
  // ไอคอนโหลดใหม่ (Figma 2026-07-23) — currentColor = #434343 (dock ใช้ text-caption)
  return (
    <svg viewBox="0 0 80 80" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        d="M68.2 11.75C60.95 4.5 51 0 39.95 0C17.85 0 0 17.9 0 40C0 62.1 17.85 80 39.95 80C58.6 80 74.15 67.25 78.6 50H68.2C64.1 61.65 53 70 39.95 70C23.4 70 9.95 56.55 9.95 40C9.95 23.45 23.4 10 39.95 10C48.25 10 55.65 13.45 61.05 18.9L44.95 35H79.95V0L68.2 11.75Z"
      />
    </svg>
  )
}

/**
 * เนินกลาง (SVG authored เอง — ไม่มีไฟล์ export จาก Figma, docker.png เป็นแค่ภาพอ้างอิงตา):
 * เรขาคณิตอ้างอิงขนาดปุ่มกลาง (ClockButton = h-32 w-32 = 128px, R_button=64) ตามสเปก —
 * ถ้าแก้ขนาดปุ่มต้องคำนวณค่าด้านล่างใหม่ทั้งชุด (ตัวเลขผูกกันด้วยสมการ tangency ไม่ใช่ค่าอิสระ)
 *
 * - BUTTON_TOP_OFFSET = 28  (หัวปุ่มโผล่เหนือขอบบนแถบ 28px, ตรงกับ `-top-7` ของปุ่มด้านล่าง)
 * - WHITE_MARGIN_ABOVE_HEAD = 18  (ขอบขาวเหนือหัวปุ่ม → ยอดเนินสูงกว่าหัวปุ่ม 18px)
 * - CREST_R = R_button + WHITE_MARGIN_ABOVE_HEAD = 64+18 = 82  (รัศมี arc นูนของยอดเนิน,
 *   ศูนย์กลาง = ศูนย์กลางปุ่ม)
 * - HUMP_H = CREST_R − (R_button − BUTTON_TOP_OFFSET) = 82−(64−28) = 46  (ความสูง viewBox,
 *   ทำให้ยอด arc แตะ y=0 พอดี)
 * - crest center ในพิกัด local (y=0 บนสุด) = (W/2, HUMP_H+36) โดย 36 = R_button−BUTTON_TOP_OFFSET
 * - SHOULDER_R ≈ 72.52 (อยู่ในช่วง 60-80 ตามสเปก) แก้สมการ tangency ภายนอกระหว่าง crest circle
 *   กับ shoulder circle (ศูนย์กลางอยู่บน background side ที่ x=0/x=W, y=HUMP_H−SHOULDER_R) โดยกำหนด
 *   ให้ปลาย shoulder arc สัมผัสขอบล่าง (ขอบบนแถบ) แนวนอนพอดีที่ x=0 และ x=W (ไม่มีเส้นตรงคั่น) —
 *   ได้ W ≈ 220 (อยู่ในช่วง 210-220 ตามสเปก "ฐานเนินกว้าง")
 * - จุดต่อ (tangent point) ระหว่าง shoulder arc กับ crest arc ≈ (51.62, 24.41) และคู่กระจก
 *   (168.38, 24.41) — ได้จากสัดส่วนตามแนวเส้นเชื่อมศูนย์กลางสองวง (R_s/(R_s+R_c))
 */
const HUMP_PATH =
  'M 0 46 A 72.52 72.52 0 0 0 51.62 24.41 A 82 82 0 0 1 168.38 24.41 A 72.52 72.52 0 0 0 220 46 Z'

export function ClockDock({
  state,
  isPending,
  onClockAction,
  onHistory,
  onReloadMap,
}: ClockDockProps) {
  return (
    <div className="relative">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 h-[46px] w-[220px] -translate-x-1/2 translate-y-px fill-white"
        viewBox="0 0 220 46"
      >
        <path d={HUMP_PATH} />
      </svg>

      <div className="rounded-t-card bg-white pt-10 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-card">
        <div className="flex items-center justify-between px-6">
          <button
            type="button"
            onClick={onHistory}
            className="flex flex-col items-center gap-1 text-sm font-medium text-caption"
          >
            <HistoryIcon />
            ประวัติลงเวลา
          </button>

          {/* spacer เว้นที่ให้ปุ่มกลาง (absolute เทียบ wrapper) — shrink-0 กันจอแคบ (320px) ทำให้
              flex บีบ spacer จนปุ่มข้างล้ำเข้าเขตปุ่มกลาง/เนิน (ยอมให้ label ปุ่มข้าง wrap 2 บรรทัดแทน) */}
          <div className="w-32 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={onReloadMap}
            disabled={isPending}
            className="flex flex-col items-center gap-1 text-sm font-medium text-caption disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ReloadIcon />
            โหลดแผนที่ใหม่
          </button>
        </div>
      </div>

      {/* -top-7 = 28px = BUTTON_TOP_OFFSET ในคอมเมนต์ด้านบน — ต้องตรงกันเสมอ */}
      <div className="absolute -top-7 left-1/2 z-10 -translate-x-1/2">
        <ClockButton state={state} isPending={isPending} onClick={onClockAction} />
      </div>
    </div>
  )
}
