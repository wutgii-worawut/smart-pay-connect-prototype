/**
 * features/auth/hooks/useRequestOtp.ts — mutation ขอ OTP ลงทะเบียน (feature-plans/01 §1.1)
 * retry:0 มาจาก default กลางของ `lib/query-client.ts` (มาตรฐาน mutation ทุกตัว §20.4) — กันกดขอ
 * OTP ซ้ำอัตโนมัติตอนเน็ตกำกวม (rate limit ฝั่ง backend ก็มีอยู่แล้ว แต่ client ต้องไม่ยิงซ้ำเอง)
 */
import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api-client'
import { requestOtp, type RequestOtpPayload, type RequestOtpResult } from '../api/requestOtp'

export function useRequestOtp() {
  return useMutation<RequestOtpResult, ApiError, RequestOtpPayload>({
    mutationFn: requestOtp,
  })
}
