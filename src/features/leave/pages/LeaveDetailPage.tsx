/**
 * features/leave/pages/LeaveDetailPage.tsx — route `/leave/:id` (จอ `4.History Details.png` /
 * `8. Sended Pending Details.png` / `9. Sended Cancel Pending Request.png`, feature-plans/03
 * §3.4/§3.8/§3.9, P15) — เจ้าของใบลาดูรายละเอียดตัวเอง + ยกเลิกใบ PENDING เท่านั้น
 * (โหมด manager/approval ของการ์ดนี้ทำใน P20)
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LeaveRequestDetailCard } from '@/components/LeaveRequestDetailCard'
import { Spinner } from '@/components/Spinner'
import { toastError } from '@/components/toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { CancelConfirmSheet } from '../components/CancelConfirmSheet'
import { useCancelLeave } from '../hooks/useCancelLeave'
import { useLeaveRequest } from '../hooks/useLeaveRequest'

export function LeaveDetailPage() {
  usePageTitle('รายละเอียดใบลา')
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()

  const [cancelSheetOpen, setCancelSheetOpen] = useState(false)

  const { data: detail, isLoading, isError, error, refetch } = useLeaveRequest(id)
  const cancelMutation = useCancelLeave(id)

  function handleConfirmCancel() {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        setCancelSheetOpen(false)
        // ปุ่ม/toast ยกเลิกใช้โทนแดงตาม design (`9. Sended Cancel Pending Request.png`) แม้จะเป็น
        // ผลลัพธ์ที่ตั้งใจ (destructive action) — ใช้ toastError() เพราะ ToastPill มีแค่ tone
        // success(เขียว)/error(แดง) สองแบบ ไม่มี tone กลางแยกต่างหาก
        toastError('ยกเลิกคำขอแล้ว')
        navigate('/leave?tab=pending')
      },
      onError: (err) => {
        setCancelSheetOpen(false)
        toastError(err.message)
        if (err.code === 'REQUEST_NOT_PENDING') {
          void refetch()
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 border-primary" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'โหลดรายละเอียดใบลาไม่สำเร็จ'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <>
      <LeaveRequestDetailCard
        detail={detail}
        mode="owner-view"
        onClose={() => navigate(-1)}
        onCancel={() => setCancelSheetOpen(true)}
      />
      <CancelConfirmSheet
        open={cancelSheetOpen}
        onOpenChange={setCancelSheetOpen}
        onConfirm={handleConfirmCancel}
        isPending={cancelMutation.isPending}
      />
    </>
  )
}
