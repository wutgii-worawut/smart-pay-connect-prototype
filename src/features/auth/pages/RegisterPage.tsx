/**
 * features/auth/pages/RegisterPage.tsx — จอ 1.1 (+ 1.2 Digital ID Only) (feature-plans/01 §1.1-1.2)
 * Route: `/register` — เข้าได้ปกติเมื่อ `POST /auth/login` ตอบ `NEED_REGISTER` แล้ว `AuthGate`
 * เด้งมาที่นี่ (§13.2)
 *
 * guard: คน authenticated อยู่แล้วเปิด `/register` ตรง ๆ (พิมพ์ URL เอง/มี session ค้าง) → เด้งกลับ
 * '/' (P8 บันทึกแก้แผน "กับดัก P9")
 *
 * mode ควบคุมผ่าน `VITE_REGISTER_MODE` (utils/registerConfig.ts, Open Question §23 ThaID phase):
 * - 'thaid'      → จอ 1.2 "Digital ID Only" ตัดฟอร์มออกเหลือปุ่ม ThaID การ์ดใหญ่อย่างเดียว
 * - 'form'/'both' → จอ 1.1 ฟอร์มปกติ, 'both' เติมปุ่ม ThaID pill ท้ายฟอร์มด้วย
 */
import { Navigate } from 'react-router-dom'
import logoSmartpay from '@/assets/logo-smartpay.svg'
import { usePageTitle } from '@/hooks/usePageTitle'
import { RegisterForm } from '../components/RegisterForm'
import { ThaidButton } from '../components/ThaidButton'
import { useAuthStore } from '../stores/authStore'
import { getRegisterMode } from '../utils/registerConfig'

export function RegisterPage() {
  usePageTitle('ลงทะเบียน')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const mode = getRegisterMode()

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-onboarding-top to-onboarding-bottom px-6 pt-14 pb-10">
      <img src={logoSmartpay} alt="SmartPay Connect" className="h-16 w-auto" />

      <h1 className="text-lg font-semibold text-primary-strong">ลงทะเบียนผู้ใช้งาน</h1>

      {mode === 'thaid' ? (
        <div className="flex flex-1 flex-col items-center gap-6 pt-2 text-center">
          <p className="text-sm text-caption">ด้วย Digital ID</p>
          <ThaidButton variant="card" />
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-1 flex-col gap-6">
          <RegisterForm />

          {mode === 'both' ? (
            <>
              <div className="flex items-center gap-3 text-sm font-medium text-primary-strong">
                <span className="h-px flex-1 bg-primary-strong" aria-hidden="true" />
                หรือ
                <span className="h-px flex-1 bg-primary-strong" aria-hidden="true" />
              </div>
              <p className="text-center text-sm text-caption">ลงทะเบียนด้วย Digital ID</p>
              <ThaidButton variant="pill" />
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
