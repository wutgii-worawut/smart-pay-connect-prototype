/**
 * features/leave/pages/LeaveFormPage.tsx — route `/leave/new` (จอ 6.1/6.2 → 7, feature-plans/03
 * §3.6-§3.7, P16) รวม query (balance/holidays/teammates) + มูเทชัน `useSubmitLeave` ไว้ที่นี่ตามที่
 * spec P16 ระบุ page เป็นเจ้าของ data-fetching+มูเทชัน — `LeaveForm` เป็น presentational รับ props
 *
 * สลับไปจอสำเร็จ (จอ 7) แบบ in-page state (`successResult`) มิเรอร์ `RegisterSuccessPage` (P10) แทนที่
 * จะแยกเป็น route/`LeaveSuccessPage` ใหม่ — ไม่ navigate ไปที่อื่น เก็บ URL `/leave/new` ไว้ระหว่างเห็น
 * จอสำเร็จ (เลือกทางนี้เพราะ "simplest consistent approach" ตาม spec P16 — ไม่ต้องเพิ่ม route/guard
 * ใหม่สำหรับ state ที่มีแค่ก้อนเดียวในหน่วยความจำ ไม่ต้อง persist ข้าม reload)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { useHolidays } from '@/hooks/useHolidays'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import type { LeaveCreatePayload, LeaveCreateResult } from '@/types/leave'
import { LeaveForm } from '../components/LeaveForm'
import { LeaveSuccessView } from '../components/LeaveSuccessView'
import { useLeaveBalance } from '../hooks/useLeaveBalance'
import { useSubmitLeave } from '../hooks/useSubmitLeave'
import { useTeammates } from '../hooks/useTeammates'

export function LeaveFormPage() {
  usePageTitle('ยื่นใบลา')
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  const [successResult, setSuccessResult] = useState<LeaveCreateResult | null>(null)

  const balanceQuery = useLeaveBalance(year)
  const holidaysQuery = useHolidays(year)
  const teammatesQuery = useTeammates()
  const submitMutation = useSubmitLeave()

  function handleSubmit(payload: LeaveCreatePayload) {
    submitMutation.mutate(payload, {
      onSuccess: (result) => setSuccessResult(result),
    })
  }

  if (successResult) {
    return (
      <LeaveSuccessView
        result={successResult}
        onBackToPending={() => navigate('/leave?tab=pending', { replace: true })}
      />
    )
  }

  const isLoading = balanceQuery.isLoading || holidaysQuery.isLoading || teammatesQuery.isLoading
  const isError = balanceQuery.isError || holidaysQuery.isError || teammatesQuery.isError

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 border-primary" />
      </div>
    )
  }

  if (isError || !balanceQuery.data || !holidaysQuery.data || !teammatesQuery.data) {
    const firstError = balanceQuery.error ?? holidaysQuery.error ?? teammatesQuery.error
    return (
      <ErrorState
        message={firstError instanceof ApiError ? firstError.message : 'โหลดข้อมูลฟอร์มลาไม่สำเร็จ'}
        onRetry={() => {
          void balanceQuery.refetch()
          void holidaysQuery.refetch()
          void teammatesQuery.refetch()
        }}
      />
    )
  }

  return (
    <LeaveForm
      balances={balanceQuery.data}
      holidays={holidaysQuery.data}
      teammates={teammatesQuery.data.teammates}
      approverName={teammatesQuery.data.approverName}
      isPending={submitMutation.isPending}
      submitError={submitMutation.error}
      onSubmit={handleSubmit}
    />
  )
}
