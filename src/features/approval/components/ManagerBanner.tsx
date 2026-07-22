/**
 * features/approval/components/ManagerBanner.tsx — การ์ดน้ำเงินโชว์ตัวตนหัวหน้าทีม
 * (P19, จอ `1.Pending List.png`/`4.History.png`) — presentational ล้วน รับ `name` เป็น prop
 * (ห้าม useQuery/useAuthStore ในนี้ — feature `approval` ห้าม import `features/auth`, กฎเหล็ก §6;
 * `app/ApprovalRoute.tsx` เป็นคนอ่าน auth แล้วส่งชื่อมาให้)
 *
 * avatar วงกลม initials มาจาก `utils/initials.ts` (approximate — ดูคอมเมนต์ที่ไฟล์นั้น)
 */
import { getInitials } from '../utils/initials'

interface ManagerBannerProps {
  /** ชื่อหัวหน้า (จาก `Employee.name` — ไม่มีคำนำหน้า "คุณ" มาด้วย เติมที่นี่ให้ตรง design) */
  name: string
}

export function ManagerBanner({ name }: ManagerBannerProps) {
  const initials = getInitials(name)

  return (
    <div className="flex items-center gap-4 overflow-hidden rounded-card bg-primary px-5 py-4 text-white">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white/80">หัวหน้า</p>
        <p className="truncate text-lg font-bold">คุณ{name}</p>
      </div>
    </div>
  )
}
