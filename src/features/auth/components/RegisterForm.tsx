/**
 * features/auth/components/RegisterForm.tsx — จอ 1.1 ฟอร์มลงทะเบียน (feature-plans/01 §1.1)
 *
 * Zod = ด่านตรวจฝั่ง client: เลขบัตร ปชช. 13 หลัก + checksum (utils/citizenId.ts, สูตรกรมการปกครอง)
 * + อีเมล (+ โดเมนองค์กร ถ้าตั้ง `VITE_ALLOWED_EMAIL_DOMAIN` — โดเมนจริงยังไม่ยืนยัน §23)
 *
 * ⚠️ สัญญากับ P6 (TextInput mask="citizenId"): ค่าที่อยู่ใน RHF form state เป็น string
 * **formatted มีขีด** (เช่น "1-2345-67890-12-1") — ต้อง `extractCitizenIdDigits()` ก่อน validate
 * checksum และก่อนส่ง payload จริง (API ต้องได้ digits ล้วน ไม่มีขีด)
 *
 * error mapping (§16.2, feature-plans/01 §1.1 — เคาะโดยผู้ใช้ 2026-07-21 เปลี่ยนจาก root → field-level
 * เพราะฟอร์มมีแค่ 2 ช่องและรู้ความหมายของแต่ละ code เอง):
 * - `EMPLOYEE_NOT_FOUND` / `VALIDATION_ERROR` → `setError('citizenId', ...)` (โชว์ใต้ช่องเลขบัตร —
 *   ตัวตนไม่พบ/รูปแบบข้อมูลไม่ผ่านที่ backend, client Zod ดัก format เกือบหมดแล้วจึงเป็น best-effort)
 * - `OTP_RATE_LIMITED` → toast (ไม่ผูก field, ข้อความมีเวลารอมาจาก backend อยู่แล้ว)
 * - ApiError code อื่น (`NETWORK_ERROR`, `UNAUTHORIZED`, ฯลฯ) → toast ด้วย `error.message` (ไทยจาก
 *   ApiError อยู่แล้ว §16.1)
 * - ไม่ใช่ ApiError เลย (เช่น ZodError จาก boundary ถ้า backend ตอบ shape เพี้ยน) → toast ไทย fallback
 *   คงที่ — **ห้าม dump ข้อความ error ดิบ (มักเป็นอังกฤษ) ให้ผู้ใช้เห็น**
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PrimaryButton } from '@/components/PrimaryButton'
import { TextInput } from '@/components/TextInput'
import { toastError } from '@/components/toast'
import { ApiError } from '@/lib/api-client'
import { extractCitizenIdDigits, isValidCitizenId } from '@/utils/citizenId'
import { useRequestOtp } from '../hooks/useRequestOtp'
import { useRegisterStore } from '../stores/registerStore'
import { getAllowedEmailDomain } from '../utils/registerConfig'

const registerSchema = z.object({
  citizenId: z
    .string()
    .min(1, 'กรุณากรอกเลขประจำตัวประชาชน')
    .refine((value) => extractCitizenIdDigits(value).length === 13, {
      message: 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก',
    })
    .refine((value) => isValidCitizenId(extractCitizenIdDigits(value)), {
      message: 'เลขประจำตัวประชาชนไม่ถูกต้อง',
    }),
  // อ่าน getAllowedEmailDomain() ที่เวลา validate จริง (ไม่ cache ตอน module load) — โดเมนอ่านจาก
  // env สดทุกครั้ง ทำให้เทสต์สลับค่าได้ด้วย vi.stubEnv โดยไม่ต้องแยกไฟล์เทสต์ (registerConfig.ts)
  email: z.string().superRefine((value, ctx) => {
    const emailCheck = z.email().safeParse(value)
    if (!emailCheck.success) {
      ctx.addIssue({ code: 'custom', message: 'รูปแบบอีเมลไม่ถูกต้อง' })
      return
    }
    const domain = getAllowedEmailDomain()
    if (domain && !value.toLowerCase().endsWith(`@${domain}`)) {
      ctx.addIssue({ code: 'custom', message: `กรุณาใช้อีเมลขององค์กร (@${domain})` })
    }
  }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

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

export function RegisterForm() {
  const navigate = useNavigate()
  const setPendingOtp = useRegisterStore((state) => state.setPendingOtp)
  const requestOtpMutation = useRequestOtp()
  const allowedDomain = getAllowedEmailDomain()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { citizenId: '', email: '' },
  })

  function onSubmit(values: RegisterFormValues) {
    requestOtpMutation.mutate(
      { citizenId: extractCitizenIdDigits(values.citizenId), email: values.email },
      {
        onSuccess: (result) => {
          setPendingOtp({ email: result.email, refCode: result.refCode })
          navigate('/register/otp')
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            // ไม่ใช่ ApiError (เช่น ZodError จาก boundary) — ห้าม dump ข้อความดิบให้ผู้ใช้
            toastError('เกิดข้อผิดพลาด กรุณาลองใหม่')
            return
          }
          if (error.code === 'EMPLOYEE_NOT_FOUND' || error.code === 'VALIDATION_ERROR') {
            setError('citizenId', { message: error.message })
            return
          }
          // OTP_RATE_LIMITED + ApiError code อื่น ๆ ที่ไม่ผูก field เฉพาะ → toast
          toastError(error.message)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <TextInput
        label="เลขประจำตัวประชาชน"
        shape="pill"
        mask="citizenId"
        placeholder="1-2345-67890-12-3"
        error={errors.citizenId?.message}
        {...register('citizenId')}
      />
      <TextInput
        label={allowedDomain ? `อีเมล @${allowedDomain}` : 'อีเมล'}
        shape="pill"
        type="email"
        placeholder="spuser@sp.go.th"
        error={errors.email?.message}
        {...register('email')}
      />
      <PrimaryButton
        type="submit"
        shape="pill"
        icon={<CheckIcon />}
        isPending={requestOtpMutation.isPending}
        pendingText="กำลังส่ง..."
      >
        ลงทะเบียน
      </PrimaryButton>
    </form>
  )
}
