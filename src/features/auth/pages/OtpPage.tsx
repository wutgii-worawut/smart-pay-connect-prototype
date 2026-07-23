/**
 * features/auth/pages/OtpPage.tsx — จอ 1.3 OTP (feature-plans/01 §1.3)
 * Route: `/register/otp` — เข้าได้ต่อจาก `RegisterForm` (P9) navigate มาเท่านั้น
 *
 * guard: `pendingOtp === null` (เปิด URL ตรง ๆ ไม่ผ่านฟอร์ม/refresh กลางทาง เพราะ registerStore
 * ไม่ persist) → เด้งกลับ `/register` (plan/progress.md บันทึกแก้แผน P9 "กับดัก P10 พร้อมใช้")
 *
 * OTP ครบ = regex `/^[A-Z0-9]{6}$/` **ห้ามเช็คด้วย length === 6** เพราะ `OTPInput` ใช้ ' ' เป็น
 * placeholder ช่องกลางที่ถูกลบ (P6 บันทึกแก้แผน 2.1) — ค่ายาว 6 อาจมี space แทรกกลางได้ ปุ่มยืนยัน
 * enable เฉพาะเมื่อค่า `otp` match regex ตรง ๆ ผ่าน `useWatch` (ไม่ใช้ RHF `formState.isValid` เพราะ
 * ค่านั้นยังไม่อัปเดตจนกว่าจะมี validation trigger รอบแรก — เช็ค regex ตรงจึงชัดเจน/ทดสอบได้ตรงสเปค
 * กว่า) `zodResolver` (regex เดียวกัน) ยังใช้คู่กันสำหรับ error message ตอน submit/OTP_INVALID
 *
 * หลัง verify-otp สำเร็จ: `setSession(token, employee)` (authStore, P8) แล้ว navigate ไป
 * `/register/success` — **ยังไม่เคลียร์ pendingOtp ที่นี่** ปล่อยให้ `RegisterSuccessPage` เคลียร์
 * ตอน mount (กันเคส effect ยังไม่ทันรัน แล้วผู้ใช้กดย้อนกลับมาเจอ guard พังกลางทาง)
 */
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import logoSmartpay from '@/assets/logo-smartpay.svg'
import { OTPInput } from '@/components/OTPInput'
import { PrimaryButton } from '@/components/PrimaryButton'
import { toastError } from '@/components/toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { useRequestOtp } from '../hooks/useRequestOtp'
import { useResendCountdown } from '../hooks/useResendCountdown'
import { useVerifyOtp } from '../hooks/useVerifyOtp'
import { useAuthStore } from '../stores/authStore'
import { useRegisterStore } from '../stores/registerStore'

/** OTP ครบ = 6 ตัวอักษร/เลข ไม่มี space แทรก (P6 บันทึกแก้แผน 2.1 — ห้ามเช็คด้วย length) */
const OTP_COMPLETE_REGEX = /^[A-Z0-9]{6}$/

const otpSchema = z.object({
  otp: z.string().regex(OTP_COMPLETE_REGEX, 'กรุณากรอกรหัส OTP ให้ครบ 6 หลัก'),
})

type OtpFormValues = z.infer<typeof otpSchema>

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </svg>
  )
}

export function OtpPage() {
  usePageTitle('ยืนยัน OTP')
  const navigate = useNavigate()
  const pendingOtp = useRegisterStore((state) => state.pendingOtp)
  const setPendingOtp = useRegisterStore((state) => state.setPendingOtp)
  const setSession = useAuthStore((state) => state.setSession)
  const [otpExpired, setOtpExpired] = useState(false)

  const verifyOtpMutation = useVerifyOtp()
  const requestOtpMutation = useRequestOtp()
  const countdown = useResendCountdown()

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
    // ไม่ตั้ง mode:'onChange' — ปล่อย default 'onSubmit' (validate ตอน submit เท่านั้น) กัน error
    // แดง/ข้อความ "กรุณากรอกรหัส OTP ให้ครบ 6 หลัก" โผล่ทุก keystroke ระหว่างกรอกปกติ (consultant
    // review P10 F1 — ขัด design + pattern P9 ที่ validate ตอน submit). ปุ่มยืนยัน enable ไม่กระทบ
    // เพราะขับด้วย `useWatch` + regex ตรง ๆ ด้านล่าง ไม่ได้พึ่ง formState.isValid; reValidateMode
    // default (onChange) ยังเคลียร์ error OTP_INVALID ที่ setError ไว้ทันทีที่ผู้ใช้แก้ค่าใหม่
  })

  const otpValue = useWatch({ control, name: 'otp' })
  const isOtpComplete = OTP_COMPLETE_REGEX.test(otpValue ?? '')

  if (!pendingOtp) {
    return <Navigate to="/register" replace />
  }

  // แยกเป็น const primitive ตรง ๆ (ไม่ใช่ pendingOtp.xxx) — TS ไม่ narrow ค่าที่ถูก capture ผ่าน
  // closure ของ nested function (onSubmit/handleResend) ข้าม early-return ด้านบนได้
  const { email, refCode, citizenId } = pendingOtp

  function onSubmit(values: OtpFormValues) {
    verifyOtpMutation.mutate(
      { otp: values.otp, refCode },
      {
        onSuccess: (result) => {
          setSession(result.token, result.employee)
          navigate('/register/success', { replace: true })
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            toastError('เกิดข้อผิดพลาด กรุณาลองใหม่')
            return
          }
          if (error.code === 'OTP_INVALID') {
            setError('otp', { message: error.message })
            return
          }
          if (error.code === 'OTP_EXPIRED') {
            setOtpExpired(true)
            countdown.forceReady()
            toastError(error.message)
            return
          }
          toastError(error.message)
        },
      },
    )
  }

  function handleResend() {
    requestOtpMutation.mutate(
      { citizenId, email },
      {
        onSuccess: (result) => {
          setPendingOtp({ email, refCode: result.refCode, citizenId })
          reset({ otp: '' })
          setOtpExpired(false)
          countdown.reset()
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            toastError(error.message)
            return
          }
          toastError('เกิดข้อผิดพลาด กรุณาลองใหม่')
        },
      },
    )
  }

  const resendDisabled = !countdown.isReady || requestOtpMutation.isPending

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-onboarding-top to-onboarding-bottom px-6 pt-14 pb-10">
      <img src={logoSmartpay} alt="SmartPay Connect" className="h-16 w-auto" />

      <h1 className="text-lg font-semibold text-primary-dark">ลงทะเบียนผู้ใช้งาน</h1>

      <p className="text-center text-sm text-text-secondary">
        ส่งรหัส OTP ไปยังอีเมลของท่านแล้ว (รหัสมีอายุการใช้งาน 15 นาที)
        <br />
        กรุณากรอกรหัสเพื่อยืนยันอีเมลของท่าน
      </p>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="rounded-full border border-primary/20 bg-white px-4 py-3 text-center text-sm font-medium text-primary-dark">
          {email}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <p className="text-center text-sm text-text-secondary">
            รหัส OTP เลขอ้างอิง {refCode}
          </p>

          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <OTPInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.otp?.message}
              />
            )}
          />

          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className={[
              'flex items-center justify-center gap-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
              otpExpired ? 'text-danger' : 'text-primary-dark',
            ].join(' ')}
          >
            <RefreshIcon />
            {countdown.isReady
              ? 'ส่งรหัสอีกครั้ง'
              : `ส่งรหัสอีกครั้ง (${countdown.remaining} วิ)`}
          </button>

          <PrimaryButton
            type="submit"
            shape="pill"
            icon={<CheckIcon />}
            isPending={verifyOtpMutation.isPending}
            pendingText="กำลังยืนยัน..."
            disabled={!isOtpComplete}
          >
            ยืนยัน
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
