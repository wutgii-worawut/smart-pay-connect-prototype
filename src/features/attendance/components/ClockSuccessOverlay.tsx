/**
 * features/attendance/components/ClockSuccessOverlay.tsx — จอสำเร็จ (จอ 2/4/7/9) ทับเต็มจอชั่วคราว
 * หลังลงเวลาสำเร็จ — ห่อ `SuccessScreen` (S17, shared) ด้วยเนื้อหาเฉพาะ attendance: เวลาตัวใหญ่ +
 * ไทม์ไลน์ "วันนี้" (เข้า/ออก)
 *
 * แถวไทม์ไลน์: onsite = badge เขียว ไม่โชว์ที่อยู่เต็ม (จอ 2/4); remote = badge น้ำเงินเข้ม + โชว์
 * ที่อยู่เต็มบรรทัดรอง (จอ 7/9) — มาจาก design จริงที่ remote ต้องมีที่อยู่ยืนยันเพิ่มเพราะไม่ใช่
 * ออฟฟิศ (contract flag: ต้องมี `office.address` — ดู types/attendance.ts)
 *
 * ⚠️ `absolute inset-0` (ไม่ใช่ `fixed`) — ตั้งใจให้ overlay คลุมแค่พื้นที่ container ของ ClockPage
 * (parent ต้อง `relative`) ไม่ทับ `ProfileBar` ด้านบน ตรงตาม design จอ 2/4/7/9 ที่ยังเห็น ProfileBar
 * อยู่เหนือจอสำเร็จเสมอ
 */
import { formatThaiDate } from '@/utils/date'
import { SuccessScreen } from '@/components/SuccessScreen'
import type { ClockType } from '../types/attendance'

export interface ClockSuccessEntry {
  time: string
  type: ClockType
  locationLabel: string
  addressLabel?: string
}

interface ClockSuccessOverlayProps {
  title: string
  /** 'YYYY-MM-DD' — มาจาก server (§15 client clock untrusted) */
  date: string
  /** "HH:mm" ตัวใหญ่กลางจอ */
  time: string
  entries: ClockSuccessEntry[]
  onBackHome: () => void
}

function HomeIcon() {
  // ไอคอนบ้าน (Figma 2026-07-23) — currentColor = #434343 (ปุ่มขาว "กลับหน้าหลัก")
  return (
    <svg viewBox="0 0 50 43" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M25 6.725L37.5 17.975V37.5H32.5V22.5H17.5V37.5H12.5V17.975L25 6.725ZM25 0L0 22.5H7.5V42.5H22.5V27.5H27.5V42.5H42.5V22.5H50L25 0Z"
      />
    </svg>
  )
}

function CalendarIcon() {
  // ไอคอนปฏิทิน จอสำเร็จ (Figma 2026-07-23) — currentColor = #434343
  return (
    <svg viewBox="0 0 45 50" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M40 5H37.5V0H32.5V5H12.5V0H7.5V5H5C2.225 5 0 7.25 0 10V45C0 47.75 2.225 50 5 50H40C42.75 50 45 47.75 45 45V10C45 7.25 42.75 5 40 5ZM40 45H5V20H40V45ZM40 15H5V10H40V15ZM10 25H22.5V37.5H10V25Z"
      />
    </svg>
  )
}

function LocationPinIcon() {
  // ไอคอนปักหมุด (Figma 2026-07-23) — currentColor = #434343
  return (
    <svg viewBox="0 0 40 50" fill="none" className="h-4 w-4 shrink-0 text-caption" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 25C17.25 25 15 22.75 15 20C15 17.25 17.25 15 20 15C22.75 15 25 17.25 25 20C25 22.75 22.75 25 20 25ZM35 20.5C35 11.425 28.375 5 20 5C11.625 5 5 11.425 5 20.5C5 26.35 9.875 34.1 20 43.35C30.125 34.1 35 26.35 35 20.5ZM20 0C30.5 0 40 8.05 40 20.5C40 28.8 33.325 38.625 20 50C6.675 38.625 0 28.8 0 20.5C0 8.05 9.5 0 20 0Z"
      />
    </svg>
  )
}

export function ClockSuccessOverlay({
  title,
  date,
  time,
  entries,
  onBackHome,
}: ClockSuccessOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-surface">
      <SuccessScreen
        title={title}
        action={
          // ปุ่มขาว ไอคอน+ตัวอักษร #434343 (Figma จอ 2/4/7/9) — ไม่ใช่ปุ่มน้ำเงิน PrimaryButton
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-semibold text-caption shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <HomeIcon />
            กลับหน้าหลัก
          </button>
        }
      >
        <div className="rounded-card bg-white p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">{formatThaiDate(date, 'd-MMMM-yyyy')}</p>
          <p className="mt-2 text-4xl font-bold text-primary-dark">{time}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-caption">
          <CalendarIcon />
          วันนี้
        </div>

        <ol className="mt-3 flex flex-col gap-3">
          {entries.map((entry, index) => (
            <li key={`${entry.time}-${index}`} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              <div className="flex flex-1 items-center gap-3 rounded-card border border-primary/10 bg-white px-4 py-3">
                <span
                  className={[
                    'shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white',
                    entry.type === 'remote' ? 'bg-primary-dark' : 'bg-success',
                  ].join(' ')}
                >
                  {entry.time}
                </span>
                <LocationPinIcon />
                <div className="min-w-0">
                  <p className="truncate text-sm text-primary-dark">{entry.locationLabel}</p>
                  {entry.addressLabel ? (
                    <p className="truncate text-xs text-text-secondary">{entry.addressLabel}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SuccessScreen>
    </div>
  )
}
