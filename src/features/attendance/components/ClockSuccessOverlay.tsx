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
import { PrimaryButton } from '@/components/PrimaryButton'
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
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
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
          <PrimaryButton shape="pill" icon={<HomeIcon />} onClick={onBackHome}>
            กลับหน้าหลัก
          </PrimaryButton>
        }
      >
        <div className="rounded-card bg-white p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">{formatThaiDate(date, 'd-MMMM-yyyy')}</p>
          <p className="mt-2 text-4xl font-bold text-primary-dark">{time}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary-dark">
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
