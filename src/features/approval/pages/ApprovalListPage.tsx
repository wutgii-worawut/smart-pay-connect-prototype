/**
 * features/approval/pages/ApprovalListPage.tsx — container ของหน้า `/approval` (P19, จอ
 * `1.Pending List.png` / `4.History.png`, feature-plans/04 §4.1/§4.4)
 *
 * โครง: `ManagerBanner` (รับ `managerName` prop จาก `app/ApprovalRoute.tsx` — feature นี้ห้าม import
 * `features/auth` ตามกฎเหล็ก §6) → `ApprovalTabs` (แท็บใน รออนุมัติ(n)|ประวัติการอนุมัติ, ควบคุมผ่าน
 * URL `?tab=` มิเรอร์ idiom เดียวกับ `LeaveShellPage` กันบั๊ก back จาก P20 detail→list แล้ว tab
 * รีเซ็ตกลับ) → `DropdownFilter` ปี/เดือน → list `LeaveRequestCard showEmployeeName`
 *
 * 🔴 decision (task brief สั่งให้ตัดสินใจเองแล้ว flag): `DropdownFilter` ปี/เดือน แสดงคู่กันทั้ง
 * 2 แท็บเพื่อ parity กับ design (จอ Pending List ก็มี filter นี้อยู่ในภาพ) แต่ `GET
 * /approval/pending` **ไม่รับ param ปี/เดือนตาม contract** (§16.3 invented ที่ `api/getPending.ts`)
 * ค่าที่เลือกจึงมีผลกับแท็บ "ประวัติการอนุมัติ" เท่านั้น (wire เข้า `useApprovalHistory` — แท็บ
 * pending ใช้ `usePendingRequests()` เฉย ๆ ไม่ผ่าน filter ใด ๆ)
 *
 * ปี/เดือนเริ่มต้น = ปี/เดือนปัจจุบัน (client clock) — ยอมรับได้เพราะเป็นแค่ค่าเริ่มต้นของ UI filter
 * (ผู้ใช้เปลี่ยนเองได้ทันที) เหมือน idiom เดียวกับ `AttendanceHistoryPage`/`CalendarShellPage`
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DropdownFilter } from '@/components/DropdownFilter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LeaveRequestCard } from '@/components/LeaveRequestCard'
import { Spinner } from '@/components/Spinner'
import { ApiError } from '@/lib/api-client'
import { ManagerBanner } from '../components/ManagerBanner'
import { ApprovalTabs } from '../components/ApprovalTabs'
import { useApprovalHistory } from '../hooks/useApprovalHistory'
import { usePendingRequests } from '../hooks/usePendingRequests'
import { APPROVAL_MONTH_OPTIONS, generateApprovalYearOptions } from '../utils/filterOptions'

type ApprovalListTab = 'pending' | 'history'

/** whitelist รับเฉพาะ 'pending' | 'history' — ค่าอื่น/ไม่มี/ผิด ⇒ ถือเป็น 'pending' (default tab) */
function isApprovalTab(value: string | null): value is ApprovalListTab {
  return value === 'pending' || value === 'history'
}

interface ApprovalListPageProps {
  managerName: string
}

export function ApprovalListPage({ managerName }: ApprovalListPageProps) {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: ApprovalListTab = isApprovalTab(tabParam) ? tabParam : 'pending'

  // lazy init ครั้งเดียวตอน mount กัน re-render ทำตัวเลือก/ค่าเริ่มต้นขยับ (มิเรอร์
  // AttendanceHistoryPage/LeaveShellPage) — ให้ vi.setSystemTime ในเทสต์มีผลตอน render จริง
  const [yearOptions] = useState(() => generateApprovalYearOptions(new Date().getFullYear()))
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1))

  const {
    data: pendingRequests,
    isLoading: pendingLoading,
    isError: pendingIsError,
    error: pendingError,
    refetch: refetchPending,
  } = usePendingRequests()

  const {
    data: historyRequests,
    isLoading: historyLoading,
    isError: historyIsError,
    error: historyError,
    refetch: refetchHistory,
  } = useApprovalHistory(Number(year), Number(month), { enabled: tab === 'history' })

  const pendingCount = pendingRequests?.length ?? 0

  function handleTabChange(next: ApprovalListTab) {
    if (next === tab) return
    setSearchParams({ tab: next }, { replace: true })
  }

  const requests = tab === 'pending' ? pendingRequests : historyRequests
  const isLoading = tab === 'pending' ? pendingLoading : historyLoading
  const isError = tab === 'pending' ? pendingIsError : historyIsError
  const error = tab === 'pending' ? pendingError : historyError
  const onRetry = tab === 'pending' ? () => void refetchPending() : () => void refetchHistory()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
      <ManagerBanner name={managerName} />

      <div className="mt-5">
        <ApprovalTabs value={tab} onChange={handleTabChange} pendingCount={pendingCount} />
      </div>

      <div className="mt-4 flex gap-2">
        <DropdownFilter options={yearOptions} value={year} onChange={setYear} ariaLabel="กรองปี" />
        <DropdownFilter
          options={APPROVAL_MONTH_OPTIONS}
          value={month}
          onChange={setMonth}
          ariaLabel="กรองเดือน"
        />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 border-primary" />
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof ApiError ? error.message : 'โหลดรายการไม่สำเร็จ'}
            onRetry={onRetry}
          />
        ) : !requests || requests.length === 0 ? (
          <EmptyState
            message={tab === 'pending' ? 'ไม่มีใบลาที่รออนุมัติ' : 'ยังไม่มีประวัติการอนุมัติ'}
          />
        ) : (
          requests.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              showEmployeeName
              onClick={() => navigate(`/approval/${request.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
