/**
 * features/attendance/hooks/useClockIn.ts — mutation ลงเวลาเข้างาน (retry:0 จาก default กลาง §20.4
 * — ห้ามยิงซ้ำอัตโนมัติ กันลงเวลาเข้าซ้ำตอนเน็ตกำกวม) invalidate `attendance/today` เสมอหลังสำเร็จ
 * เพื่อให้ ClockPage เห็นสถานะล่าสุด (clockedIn/clockInTime ใหม่)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { clockIn } from '../api/clockIn'
import type { ClockRequestPayload, ClockResponse } from '../types/attendance'
import { attendanceTodayQueryKey } from './useAttendanceToday'

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation<ClockResponse, ApiError, ClockRequestPayload>({
    mutationFn: clockIn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceTodayQueryKey })
    },
  })
}
