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

  function handleClose() {
    // ปุ่ม "ปิด" — กลับไปหน้าก่อนหน้าถ้ามีประวัติจริงในเซสชันนี้ (idx > 0, react-router browser
    // history state) ไม่งั้น fallback ไปรายการ `/leave` (กันเคสเปิดลิงก์ detail ตรง ๆ ไม่มี history
    // ให้ย้อน — เดิม `navigate(-1)` เปล่าไม่มี fallback นี้, backport จาก `ApprovalDetailPage` P20 (ฉ))
    const state: unknown = window.history.state
    const idx = state && typeof state === 'object' && 'idx' in state ? state.idx : undefined
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
    } else {
      navigate('/leave')
    }
  }

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
        onClose={handleClose}
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
