/**
 * features/approval/pages/ApprovalDetailPage.tsx — route `/approval/:id` (จอ `2.Pending Details.png`
 * / `3.Approve - Success.png` / `5.History Details - Approved.png` / `6.History Details - Read
 * Only.png` / `7.Reject - Success.png`, feature-plans/04 §4.2-4.3/§4.5-4.7, P20) — หัวหน้าดูรายละเอียด
 * ใบลาของลูกทีมแล้วอนุมัติ/ไม่อนุมัติ (ใบ PENDING) หรือดูอย่างเดียว (ใบที่ตัดสินไปแล้ว)
 *
 * เลือก mode ของ `LeaveRequestDetailCard` จาก **status** ของ detail (ไม่ใช่จาก route/param อื่น):
 * PENDING → `approver-action` (มีปุ่มตัดสิน), อื่น ๆ (APPROVED/REJECTED) → `approver-view` (read-only)
 * — การ์ดเองก็ gate ปุ่มด้วย mode ไม่ใช่ status ซ้ำอีกชั้น (กันกับดัก P15 #4)
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { LeaveRequestDetailCard } from '@/components/LeaveRequestDetailCard'
import type { LeaveRequestDetailCardMode } from '@/components/LeaveRequestDetailCard'
import { Spinner } from '@/components/Spinner'
import { toastError, toastSuccess } from '@/components/toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { useApprovalRequest } from '../hooks/useApprovalRequest'
import { useApprove } from '../hooks/useApprove'
import { useReject } from '../hooks/useReject'

export function ApprovalDetailPage() {
  usePageTitle('รายละเอียดใบลา')
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()

  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | undefined>(undefined)

  const { data: detail, isLoading, isError, error, refetch } = useApprovalRequest(id)
  const approveMutation = useApprove(id)
  const rejectMutation = useReject(id)

  function handleApprove() {
    // [P22 P20 (ช)] comment ว่างล้วน (whitespace ล้วน เช่น ' ') ต้องไม่หลุดเข้า payload — ส่ง
    // undefined แทนเพื่อให้ backend omit field ตามเจตนา "ถ้ามี" (validation จริงยังปล่อยผ่านเพราะ
    // approve ไม่บังคับ comment)
    approveMutation.mutate(comment.trim() || undefined, {
      onSuccess: () => {
        toastSuccess('อนุมัติคำขอลาแล้ว')
        navigate('/approval')
      },
      onError: (err) => {
        toastError(err.message)
        if (err.code === 'REQUEST_NOT_PENDING') void refetch()
      },
    })
  }

  function handleReject() {
    if (!comment.trim()) {
      setCommentError('กรุณาระบุเหตุผลการไม่อนุมัติ')
      return
    }
    setCommentError(undefined)
    rejectMutation.mutate(comment.trim(), {
      onSuccess: () => {
        toastError('ไม่อนุมัติคำขอลาแล้ว')
        navigate('/approval')
      },
      onError: (err) => {
        toastError(err.message)
        if (err.code === 'REQUEST_NOT_PENDING') void refetch()
      },
    })
  }

  function handleClose() {
    // approver-view "ปิด" — กลับไปหน้าก่อนหน้า ถ้ามีประวัติจริงในเซสชันนี้ (idx > 0, react-router
    // browser history state) ไม่งั้น fallback ไปรายการ `/approval` (กันเคสเปิดลิงก์ detail ตรง ๆ
    // ไม่มี history ให้ย้อน)
    const state: unknown = window.history.state
    const idx = state && typeof state === 'object' && 'idx' in state ? state.idx : undefined
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
    } else {
      navigate('/approval')
    }
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

  const mode: LeaveRequestDetailCardMode = detail.status === 'PENDING' ? 'approver-action' : 'approver-view'
  const isSubmitting = approveMutation.isPending || rejectMutation.isPending

  return (
    <LeaveRequestDetailCard
      detail={detail}
      mode={mode}
      comment={comment}
      onCommentChange={(value) => {
        setComment(value)
        if (commentError) setCommentError(undefined)
      }}
      commentError={commentError}
      onApprove={handleApprove}
      onReject={handleReject}
      isSubmitting={isSubmitting}
      onClose={handleClose}
    />
  )
}
