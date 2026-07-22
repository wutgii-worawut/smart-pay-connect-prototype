/**
 * features/leave/hooks/useSubmitLeave.ts — มูเทชันส่งคำขอลา (retry:0 จาก default กลาง §20.4 — ห้าม
 * ยิงซ้ำอัตโนมัติ กันยื่นใบลาซ้ำตอนเน็ตกำกวม) invalidate `leave/balance` (โควตากันไว้เปลี่ยน) +
 * `leave/requests` (list/badge "รออนุมัติ" เห็นใบใหม่) หลังสำเร็จเสมอ
 *
 * hook มินิมอลคุมแค่ cache — page (`LeaveFormPage`) เป็นคนตัดสิน UX ต่อครั้งผ่าน `mutate(_,
 * {onSuccess})` (มิเรอร์แพทเทิร์น `useClockIn`/`useCancelLeave`) ส่วน field-level error mapping
 * (QUOTA_EXCEEDED ฯลฯ) เป็นหน้าที่ของ `LeaveForm` ที่รับ `submitError` (=`.error` ของมูเทชันนี้) เป็น
 * prop ไปจาก page อีกที (ดูคอมเมนต์หัวไฟล์ `LeaveForm.tsx`)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import type { LeaveCreatePayload, LeaveCreateResult } from '@/types/leave'
import { createLeave } from '../api/createLeave'

export function useSubmitLeave() {
  const queryClient = useQueryClient()

  return useMutation<LeaveCreateResult, ApiError, LeaveCreatePayload>({
    mutationFn: createLeave,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'balance'] })
      void queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] })
    },
  })
}
