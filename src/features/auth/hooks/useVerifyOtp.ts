/**
 * features/auth/hooks/useVerifyOtp.ts — mutation ยืนยัน OTP ผูกบัญชี (feature-plans/01 §1.3)
 * retry:0 มาจาก default กลางของ `lib/query-client.ts` (มาตรฐาน mutation ทุกตัว §20.4) — ยืนยัน OTP
 * ต้องไม่ยิงซ้ำอัตโนมัติ (รหัสผิดครั้งเดียวไม่ควร retry เงียบ ๆ)
 */
import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { verifyOtp, type VerifyOtpPayload, type VerifyOtpResult } from '../api/verifyOtp'

export function useVerifyOtp() {
  return useMutation<VerifyOtpResult, ApiError, VerifyOtpPayload>({
    mutationFn: verifyOtp,
  })
}
