/**
 * features/auth/pages/RegisterSuccessPage.tsx — จอ 1.4 (feature-plans/01 §1.4)
 * Route: `/register/success` — เข้าได้ต่อจาก `OtpPage` หลัง verify-otp สำเร็จเท่านั้น (`setSession`
 * เกิดที่ `OtpPage` แล้วก่อน navigate มาที่นี่ — หน้านี้ไม่ยิง API ใด ๆ เพิ่ม)
 *
 * guard: `!isAuthenticated` (เปิด URL ตรง ๆ โดยไม่เคย verify-otp สำเร็จ → ไม่มี session) → เด้งกลับ
 * `/register` กัน "จอสำเร็จหลอก" (consultant review P10 F2)
 *
 * เคลียร์ `pendingOtp` ทันทีที่ mount — ปิด flow register ทั้งวง กันเปิดย้อนกลับไป `/register/otp`
 * แล้วเจอฟอร์ม OTP เก่าใช้ต่อได้ (guard ของ `OtpPage` จะเด้งกลับ `/register` เองถ้าเข้ามาซ้ำ)
 *
 * ปุ่ม "กลับหน้า SmartPay Connect" → `navigate('/', {replace:true})` ล้าง history ปัจจุบันทิ้ง
 * กัน back กลับมาที่จอนี้/OTP อีก (feature-plans/01 §1.4)
 */
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SuccessScreen } from '@/components/SuccessScreen'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '../stores/authStore'
import { useRegisterStore } from '../stores/registerStore'

export function RegisterSuccessPage() {
  usePageTitle('ลงทะเบียนสำเร็จ')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const clearPendingOtp = useRegisterStore((state) => state.clearPendingOtp)

  useEffect(() => {
    clearPendingOtp()
  }, [clearPendingOtp])

  if (!isAuthenticated) {
    return <Navigate to="/register" replace />
  }

  return (
    <SuccessScreen
      title="ลงทะเบียนสำเร็จ"
      description="การลงทะเบียนของท่านเสร็จสมบูรณ์แล้ว ขณะนี้ท่านสามารถเข้าใช้บริการต่าง ๆ บนระบบ SmartPay Connect ได้ทันที"
      action={
        <PrimaryButton shape="pill" onClick={() => navigate('/', { replace: true })}>
          กลับหน้า SmartPay Connect
        </PrimaryButton>
      }
    />
  )
}
