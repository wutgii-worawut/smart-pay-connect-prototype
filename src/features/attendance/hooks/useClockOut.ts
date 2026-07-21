/**
 * features/attendance/hooks/useClockOut.ts — mutation ลงเวลาออกงาน (retry:0 จาก default กลาง §20.4)
 * invalidate `attendance/today` เสมอหลังสำเร็จ เหมือน useClockIn
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { clockOut } from '../api/clockOut'
import type { ClockRequestPayload, ClockResponse } from '../types/attendance'
import { attendanceTodayQueryKey } from './useAttendanceToday'

export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation<ClockResponse, ApiError, ClockRequestPayload>({
    mutationFn: clockOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceTodayQueryKey })
    },
  })
}
