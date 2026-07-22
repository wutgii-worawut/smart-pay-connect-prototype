/**
 * app/LeaveApprovalTopNav.tsx — แท็บบนสุด "การลาของฉัน | รออนุมัติ (n)" สลับระหว่าง `/leave`
 * (feature `leave`) กับ `/approval` (feature `approval`) — คนละ route/คนละ feature จึงต้อง
 * compose ที่ `app/` (กฎเหล็ก §6: `features/leave` ห้าม import `features/approval` และในทางกลับกัน)
 * ทำเป็น route-based nav ไม่ใช่ view-swap ภายใน component เดียว (P14 บันทึกแก้แผน #7 สั่งไว้)
 *
 * render เฉพาะ `role === 'manager'` (พนักงานทั่วไปไม่เห็นแท็บนี้เลย คืน `null` — `LeaveShellPage`
 * ของพนักงานทั่วไปเลยหน้าตาเหมือน P14 เป๊ะ ไม่ regress)
 *
 * badge "รออนุมัติ (n)" = pending count จาก `GET /approval/pending` (`usePendingRequests`, คนละ
 * query กับแถบล่างฝั่งพนักงาน `GET /leave/requests?status=PENDING` ที่ `LeaveShellPage` ใช้เอง) —
 * ไม่โชว์ badge ถ้า 0 หรือกำลังโหลด (`SegmentedTabs` เองก็ไม่ render badge ถ้า falsy อยู่แล้ว)
 *
 * 🔴 (consultant review P19 M1) `usePendingRequests({ enabled: role === 'manager' })` — **ต้องส่ง
 * `enabled` เสมอ** ห้ามปล่อย default `true` แล้วค่อย early-return หลังเรียก hook เพราะ
 * TanStack Query ยิง request ทันทีที่ query mount ไม่สนว่า component จะ return null ทีหลังหรือไม่
 * (early-return เกิด "หลัง" hook ทำงานไปแล้วในทุก render) — ถ้าไม่ปิด query พนักงานทั่วไปทุกคนที่เปิด
 * `/leave` (หน้า traffic สูง) จะยิง `GET /approval/pending` ไปด้วย ทั้งที่ backend §17.3 ต้องตอบ
 * denial เสมอ — ถ้า backend จริงตอบ `UNAUTHORIZED` (ไม่ใช่ `FORBIDDEN`) จะโดน `onUnauthorized`
 * ล้าง session ทันที (logout loop)
 *
 * active state อ่านจาก `useLocation().pathname` — whitelist: ขึ้นต้นด้วย `/approval` → แท็บ
 * "รออนุมัติ", ไม่งั้นถือเป็น "การลาของฉัน" (ครอบคลุมทั้ง `/leave`, `/leave/new`, `/leave/:id`)
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { useAuthStore } from '@/features/auth'
import { usePendingRequests } from '@/features/approval'

type TopNavTab = 'leave' | 'approval'

export function LeaveApprovalTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAuthStore((state) => state.employee?.role)
  const isManager = role === 'manager'

  const { data: pendingRequests, isLoading } = usePendingRequests({ enabled: isManager })
  const pendingCount = isLoading ? 0 : (pendingRequests?.length ?? 0)

  if (!isManager) return null

  const activeTab: TopNavTab = location.pathname.startsWith('/approval') ? 'approval' : 'leave'

  function handleChange(value: string) {
    if (value === 'approval') {
      navigate('/approval')
      return
    }
    navigate('/leave')
  }

  return (
    <div className="px-4 pt-4">
      <SegmentedTabs
        shape="card"
        value={activeTab}
        onChange={handleChange}
        tabs={[
          { value: 'leave', label: 'การลาของฉัน' },
          { value: 'approval', label: 'รออนุมัติ', badge: pendingCount },
        ]}
      />
    </div>
  )
}
