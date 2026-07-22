/**
 * features/leave/hooks/useCancelLeave.ts — mutation ยกเลิกใบลา PENDING (retry:0 จาก default กลาง
 * §20.4 — ห้ามยิงยกเลิกซ้ำอัตโนมัติตอนเน็ตกำกวม) invalidate cache ที่เกี่ยวข้องเสมอหลังสำเร็จ
 * (`leave/requests` ให้ list/badge ตัวเลขอัปเดต, `leave/balance` ให้โควตาที่กันไว้คืนกลับ,
 * `leave/request/{id}` ให้ detail เดิมสะท้อนสถานะล่าสุด)
 *
 * toast/navigate/refetch-on-REQUEST_NOT_PENDING เป็นหน้าที่ของ `LeaveDetailPage` (มิเรอร์แพทเทิร์น
 * `useClockIn` + `ClockPage`: hook มินิมอล คุมแค่ cache, page ตัดสิน UX ผ่าน `mutate(_, {onSuccess,
 * onError})` ต่อครั้ง) — ทำให้เทสต์ hook นี้เดี่ยว ๆ ได้โดยไม่ต้องมี Router ครอบ
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { cancelRequest } from '../api/cancelRequest'
import { leaveRequestQueryKey } from './useLeaveRequest'

export function useCancelLeave(id: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: () => cancelRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] })
      void queryClient.invalidateQueries({ queryKey: ['leave', 'balance'] })
      void queryClient.invalidateQueries({ queryKey: leaveRequestQueryKey(id) })
    },
  })
}
