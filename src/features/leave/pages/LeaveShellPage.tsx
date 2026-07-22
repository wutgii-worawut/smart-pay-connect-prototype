/**
 * features/leave/pages/LeaveShellPage.tsx — route `/leave` (จอ `1.Balance.png` / `2.Pending
 * Requests.png` / `3.History.png`, feature-plans/03 §3.1-3.3, P14)
 *
 * ⚠️ DEVIATION จาก feature-plans/03 §0 (บรรยาย "SegmentedTabs บนสุด: การลาของฉัน | รออนุมัติลา —
 * แท็บขวาเห็นเฉพาะ manager"): ชุด PNG จริงของเฟสนี้**ไม่มีแท็บ manager เลย** — มีแค่แถบล่าง 2 ปุ่ม
 * เม็ดยา "ประวัติการลาของฉัน" / "ใบลารออนุมัติ ②" สลับรายการของ**ตัวเอง** (พนักงานคนเดียวกัน) แถว
 * อนุมัติของหัวหน้า (Approval) เป็นคนละหน้าจอ/คนละ endpoint อยู่ใน P19 — ยึด design จริงเป็นหลักตาม
 * CLAUDE.md ("match design ไม่ใช่คิด flow เพิ่มเอง") จึงย้าย `SegmentedTabs` (S1) จากบนมาวางที่ล่างจอ
 * แทน (comment ในตัว SegmentedTabs.tsx เองก็ระบุ use-case "ล่างสุด (Leave/Approval: ประวัติการลา
 * ของฉัน|ใบลารออนุมัติ)" ไว้อยู่แล้ว — ไม่ต้องสร้าง component ใหม่)
 *
 * ⚠️ small UX gap (worker decision, รอ designer ยืนยัน): PNG ไม่มีปุ่มชัดเจนสำหรับกลับไปหน้า "วันลา
 * คงเหลือ" จากแถบล่าง — ตัดสินใจให้กดปุ่มที่ active อยู่ซ้ำ = toggle กลับ balance
 *
 * view มาจาก URL query `?tab=` (ไม่ใช่ useState ภายในอีกต่อไป) เพื่อให้ปุ่ม back ของ LIFF header
 * ทำงานถูกต้อง (แก้บั๊ก: เดิม view เป็น local state ล้วน กด back จาก list กระโดดไปหน้าแรกเลยแทนที่จะ
 * กลับไป balance, และกด back จาก `/leave/:id` กลับมาแล้ว list ที่เคยดูอยู่หายกลายเป็น balance เพราะ
 * remount) — ใช้ push/replace แบบผสม (hybrid) ตามตารางนี้:
 *
 *   action                                              | history op
 *   ---------------------------------------------------- | ----------
 *   balance → pending/history (กดแท็บล่างครั้งแรกจาก balance) | push    (back กลับไป balance ได้)
 *   pending ↔ history (สลับ 2 list กัน)                    | replace (back ไม่ต้องไล่ทีละแท็บ)
 *   กดปุ่มที่ active อยู่ซ้ำ (toggle กลับ balance)              | replace (เคลียร์ tab, ค้าง /leave entry
 *                                                          ซ้ำไว้ 1 อันเล็กน้อย — accepted, ถ้าจะทำ
 *                                                          ให้เนียนกว่านี้ค่อยเปลี่ยนเป็น
 *                                                          location.state + navigate(-1) ทีหลัง)
 *   การ์ด → /leave/:id                                    | push (unchanged) — back กลับมาที่
 *                                                          /leave?tab=... คืน view เดิมให้อัตโนมัติ
 *
 * whitelist รับเฉพาะ 'pending' | 'history' — ค่าอื่น/ไม่มี/ผิด ⇒ ถือเป็น 'balance' (มิเรอร์ idiom
 * ?target= ของ app/HomePage.tsx §12.1)
 */
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DropdownFilter } from '@/components/DropdownFilter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { FilterChips } from '@/components/FilterChips'
import { LeaveRequestCard } from '@/components/LeaveRequestCard'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Spinner } from '@/components/Spinner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { toBuddhistYear } from '@/utils/date'
import type { LeaveBalance, LeaveRequest } from '@/types/leave'
import { LeaveBalanceCard } from '../components/LeaveBalanceCard'
import { useLeaveBalance } from '../hooks/useLeaveBalance'
import { useLeaveRequests } from '../hooks/useLeaveRequests'
import type { LeaveRequestsParams } from '../api/getRequests'
import {
  MONTH_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  generateYearFilterOptions,
  toStatusParam,
  toTypeParam,
} from '../utils/filterOptions'

type LeaveView = 'balance' | 'pending' | 'history'
type LeaveListTab = 'pending' | 'history'

function isListTab(value: string | null): value is LeaveListTab {
  return value === 'pending' || value === 'history'
}

/** ลำดับการ์ดโควตาตาม design `1.Balance.png`: ลาพักร้อน → ลาป่วย → ลากิจ (ไม่ใช่ลำดับที่ API ส่งมา) */
const BALANCE_ORDER: LeaveBalance['type'][] = ['vacation', 'sick', 'personal']

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

interface YearStepperProps {
  year: number
  onChange: (year: number) => void
}

function YearStepper({ year, onChange }: YearStepperProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1.5 shadow-card">
      <button
        type="button"
        aria-label="ปีก่อนหน้า"
        onClick={() => onChange(year - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-primary-dark"
      >
        <ChevronLeftIcon />
      </button>
      <span className="min-w-10 text-center text-base font-semibold text-primary-dark">
        {toBuddhistYear(year)}
      </span>
      <button
        type="button"
        aria-label="ปีถัดไป"
        onClick={() => onChange(year + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-primary-dark"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

interface BalanceSectionProps {
  year: number
  onYearChange: (year: number) => void
  balances: LeaveBalance[] | undefined
  isLoading: boolean
  isError: boolean
  errorMessage: string
  onRetry: () => void
}

function BalanceSection({
  year,
  onYearChange,
  balances,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: BalanceSectionProps) {
  const orderedBalances = BALANCE_ORDER.map((type) => balances?.find((b) => b.type === type)).filter(
    (b): b is LeaveBalance => Boolean(b),
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-primary-dark">วันลาคงเหลือ</h1>
        <YearStepper year={year} onChange={onYearChange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 border-primary" />
        </div>
      ) : isError ? (
        <ErrorState message={errorMessage} onRetry={onRetry} />
      ) : orderedBalances.length === 0 ? (
        <EmptyState message="ยังไม่มีข้อมูลวันลาคงเหลือ" />
      ) : (
        <div className="space-y-4">
          {orderedBalances.map((balance) => (
            <LeaveBalanceCard key={balance.type} balance={balance} />
          ))}
        </div>
      )}
    </div>
  )
}

interface RequestListSectionProps {
  view: 'pending' | 'history'
  typeFilter: string[]
  onTypeFilterChange: (value: string[]) => void
  yearFilter: string
  onYearFilterChange: (value: string) => void
  yearOptions: { value: string; label: string }[]
  monthFilter: string
  onMonthFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  requests: LeaveRequest[] | undefined
  isLoading: boolean
  isError: boolean
  errorMessage: string
  onRetry: () => void
  onSelectRequest: (id: string) => void
}

function RequestListSection({
  view,
  typeFilter,
  onTypeFilterChange,
  yearFilter,
  onYearFilterChange,
  yearOptions,
  monthFilter,
  onMonthFilterChange,
  statusFilter,
  onStatusFilterChange,
  requests,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onSelectRequest,
}: RequestListSectionProps) {
  const title = view === 'pending' ? 'รออนุมัติลา' : 'ประวัติการลาของฉัน'
  // สถานะฝั่ง "รออนุมัติลา" ล็อกที่ PENDING เสมอ (ไม่มีเหตุผลให้เปลี่ยนสถานะในมุมมองนี้ — keep simple)
  const statusValue = view === 'pending' ? 'PENDING' : statusFilter

  return (
    <div>
      <h1 className="text-lg font-semibold text-primary-dark">{title}</h1>
      <div className="mt-3 border-t border-primary/10" />

      <div className="mt-4">
        <FilterChips options={TYPE_FILTER_OPTIONS} value={typeFilter} onChange={onTypeFilterChange} />
      </div>

      <div className="mt-3 flex gap-2">
        <DropdownFilter
          options={yearOptions}
          value={yearFilter}
          onChange={onYearFilterChange}
          ariaLabel="กรองปี"
        />
        <DropdownFilter
          options={MONTH_FILTER_OPTIONS}
          value={monthFilter}
          onChange={onMonthFilterChange}
          ariaLabel="กรองเดือน"
        />
        <DropdownFilter
          options={STATUS_FILTER_OPTIONS}
          value={statusValue}
          onChange={onStatusFilterChange}
          ariaLabel="กรองสถานะ"
          disabled={view === 'pending'}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 border-primary" />
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : !requests || requests.length === 0 ? (
          <EmptyState message={view === 'pending' ? 'ไม่มีใบลาที่รออนุมัติ' : 'ยังไม่มีรายการลา'} />
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                onClick={() => onSelectRequest(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function LeaveShellPage() {
  usePageTitle('บันทึกการลา')
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const view: LeaveView = isListTab(tabParam) ? tabParam : 'balance'

  const [balanceYear, setBalanceYear] = useState(() => new Date().getFullYear())
  // ตัวเลือกปี lazy init ครั้งเดียวตอน mount (กัน re-render ทำ list ตัวเลือกขยับ เหมือน P13 monthOptions)
  const [yearOptions] = useState(() => generateYearFilterOptions(new Date().getFullYear()))

  const [typeFilter, setTypeFilter] = useState<string[]>(['all'])
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    data: balances,
    isLoading: balanceLoading,
    isError: balanceIsError,
    error: balanceError,
    refetch: refetchBalance,
  } = useLeaveBalance(balanceYear)

  // query เล็กแยกต่างหากสำหรับ badge "ใบลารออนุมัติ" บนแถบล่าง — ไม่ผูกกับ filter ของรายการหลัก
  // (ต้องนับ "รออนุมัติทั้งหมด" เสมอ ไม่ใช่แค่ที่กรองด้วยประเภท/เดือนที่ผู้ใช้เลือกอยู่)
  const { data: pendingBadgeRequests } = useLeaveRequests({ status: 'PENDING' })
  const pendingCount = pendingBadgeRequests?.length ?? 0

  const listParams: LeaveRequestsParams = useMemo(
    () => ({
      status: view === 'pending' ? 'PENDING' : toStatusParam(statusFilter),
      type: toTypeParam(typeFilter[0] ?? 'all'),
      year: yearFilter === 'all' ? undefined : Number(yearFilter),
      month: monthFilter === 'all' ? undefined : Number(monthFilter),
    }),
    [view, statusFilter, typeFilter, yearFilter, monthFilter],
  )

  const {
    data: requests,
    isLoading: requestsLoading,
    isError: requestsIsError,
    error: requestsError,
    refetch: refetchRequests,
  } = useLeaveRequests(listParams, { enabled: view !== 'balance' })

  function handleBottomTabChange(value: string) {
    if (!isListTab(value)) return
    if (value === view) {
      // กดปุ่มที่ active อยู่ซ้ำ → toggle กลับ balance: เคลียร์ tab param ด้วย replace (ดู hybrid
      // semantics table ที่หัวไฟล์ — ค้าง /leave entry ซ้ำไว้เล็กน้อย accepted)
      setSearchParams({}, { replace: true })
      return
    }
    // balance → list ครั้งแรก: push (กด back ของ LIFF กลับมา balance ได้)
    // list ↔ list (สลับ pending/history กัน): replace (กด back ไม่ต้องไล่ทีละแท็บ)
    setSearchParams({ tab: value }, { replace: view !== 'balance' })
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {view === 'balance' ? (
          <BalanceSection
            year={balanceYear}
            onYearChange={setBalanceYear}
            balances={balances}
            isLoading={balanceLoading}
            isError={balanceIsError}
            errorMessage={
              balanceError instanceof ApiError ? balanceError.message : 'โหลดวันลาคงเหลือไม่สำเร็จ'
            }
            onRetry={() => void refetchBalance()}
          />
        ) : (
          <RequestListSection
            view={view}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            yearOptions={yearOptions}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            requests={requests}
            isLoading={requestsLoading}
            isError={requestsIsError}
            errorMessage={
              requestsError instanceof ApiError ? requestsError.message : 'โหลดรายการลาไม่สำเร็จ'
            }
            onRetry={() => void refetchRequests()}
            onSelectRequest={(id) => navigate(`/leave/${id}`)}
          />
        )}
      </div>

      {view === 'balance' ? (
        <button
          type="button"
          aria-label="ยื่นลา"
          onClick={() => navigate('/leave/new')}
          className="fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-card"
        >
          <PlusIcon />
        </button>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-text-secondary/15 bg-white px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-card">
        <SegmentedTabs
          tabs={[
            { value: 'history', label: 'ประวัติการลาของฉัน' },
            { value: 'pending', label: 'ใบลารออนุมัติ', badge: pendingCount },
          ]}
          value={view === 'balance' ? '' : view}
          onChange={handleBottomTabChange}
        />
      </div>
    </div>
  )
}
