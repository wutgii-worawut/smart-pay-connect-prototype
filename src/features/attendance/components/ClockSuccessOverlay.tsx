/**
 * features/attendance/components/ClockSuccessOverlay.tsx — จอสำเร็จ (จอ 2/4/7/9) ทับเต็มจอชั่วคราว
 * หลังลงเวลาสำเร็จ — ห่อ `SuccessScreen` (S17, shared) ด้วยเนื้อหาเฉพาะ attendance: เวลาตัวใหญ่ +
 * ไทม์ไลน์ "วันนี้" (เข้า/ออก)
 *
 * แถวไทม์ไลน์: badge เวลา = primary-strong (#004c97) ทุกกรณี (confetti + badge น้ำเงินเดียวกันทั้ง
 * onsite/remote) ตามคำสั่งผู้ใช้ 2026-07-24 ให้ unify ทุกจอ — **deviation จงใจจาก PNG จอ 2/4** ที่ดีไซน์
 * เดิม onsite (ในรัศมี) เป็นเช็คเขียว + badge เขียว; addressLabel ยังคง branch ตาม remote เหมือนเดิม:
 * onsite ไม่โชว์ที่อยู่เต็ม (จอ 2/4), remote โชว์ที่อยู่เต็มบรรทัดรอง (จอ 7/9) เพราะ remote ต้องมีที่อยู่
 * ยืนยันเพิ่มเนื่องจากไม่ใช่ออฟฟิศ (contract flag: ต้องมี `office.address` — ดู types/attendance.ts)
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

function SuccessConfettiIcon() {
  // ไอคอนสำเร็จ + confetti (Figma 2026-07-23) — artwork หลายสี ยกเว้นกฎ token
  return (
    <svg viewBox="0 0 480 480" fill="none" className="h-40 w-40" aria-hidden="true">
      <circle cx="239.52" cy="239.039" r="123.84" fill="#16BE01" />
      <path
        d="M200.16 224.64L227.04 251.52L280.8 199.68L293.28 214.08L227.04 280.042L186.72 238.08L200.16 224.64Z"
        fill="white"
      />
      <path
        d="M391.049 146.727C391.049 146.727 403.493 144.569 415.798 135.956C428.103 127.343 425.451 109.509 432.119 97.5581C438.653 85.8469 456.329 81.4466 456.329 81.4466"
        stroke="#7849E5"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M11.5411 364.989L27.9125 364.989C33.8303 364.989 39.6652 363.598 44.9466 360.928L46.2869 360.25C48.9814 358.888 51.4415 357.105 53.5746 354.969L54.3734 354.168C59.174 349.359 61.8718 342.843 61.8754 336.048L61.8764 334.133C61.877 332.9 61.6974 331.674 61.3432 330.494L60.8905 328.985C59.7381 325.143 56.383 322.326 52.4076 321.795C47.8552 321.188 43.4016 323.74 41.6944 328.003C40.0072 332.217 41.3584 337.039 44.9896 339.762L46.8636 341.168C49.1296 342.867 51.8857 343.786 54.7182 343.786L61.6929 343.786C67.4706 343.786 73.1449 342.254 78.1374 339.346C80.7251 337.839 83.0933 335.983 85.1754 333.83L92.1811 326.589"
        stroke="#1088FF"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M346.08 411.997L352.064 413.229C369.647 416.851 382.663 431.744 383.899 449.653L384.48 458.077"
        stroke="#7849E5"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx="95.5201" cy="114.24" r="14.4" fill="#F40354" />
      <circle cx="114.72" cy="396.48" r="8.64" fill="#C1AEEE" />
      <circle cx="412.32" cy="317.761" r="12.48" fill="#7849E5" />
      <circle cx="398.88" cy="285.12" r="4.8" fill="#1088FF" />
      <circle cx="233.76" cy="18.2395" r="6.72" fill="#16BE00" />
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
        icon={<SuccessConfettiIcon />}
        titleClassName="text-primary-strong"
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
          <p className="text-sm text-label">{formatThaiDate(date, 'd-MMMM-yyyy')}</p>
          <p className="mt-2 text-4xl font-bold text-primary-strong">{time}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-caption">
          <CalendarIcon />
          วันนี้
        </div>

        <ol className="mt-3 flex flex-col gap-3">
          {entries.map((entry, index) => (
            <li key={`${entry.time}-${index}`} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary-strong"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-card border border-primary/10 bg-white px-4 py-3">
                <span className="shrink-0 rounded-full bg-primary-strong px-3 py-1 text-sm font-semibold text-white">
                  {entry.time}
                </span>
                <LocationPinIcon />
                <div className="min-w-0">
                  <p className="truncate text-sm text-caption">{entry.locationLabel}</p>
                  {entry.addressLabel ? (
                    <p className="truncate text-xs text-caption">{entry.addressLabel}</p>
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
