/**
 * features/payroll/pages/PayslipDetailPage.tsx — route `/payroll/:id` (จอ `2.Payslip Details.png` /
 * `2.1...fullscreen.png` / `3.Email Payslip - Success.png`, feature-plans/05 §5.2-5.3, P21)
 *
 * read-only ทั้งหน้า — เข้มเรื่องสิทธิ์ที่สุด: ไม่มีช่องกรอกอีเมลใด ๆ ปุ่มส่งอีเมลส่งไปอีเมลที่
 * ลงทะเบียนไว้เท่านั้น (backend ใช้ตัวตนจาก JWT, §16.2/§3.3) backend เขียน audit `PAYSLIP_VIEW` ทุกครั้ง
 * ที่ query สำเร็จ (ฝั่งนี้แค่เรียก endpoint จริงก็พอ ไม่ต้องทำอะไรเพิ่ม)
 *
 * [กับดัก P4 #6] เผื่อ padding-bottom ของเนื้อหาให้พ้น `BottomActionBar` ที่ fixed อยู่ล่างจอ —
 * BottomActionBar เองกันขอบล่างจอ (safe-area-inset-bottom) ไว้แล้วที่ตัวมันเอง ฝั่งเนื้อหาเราเผื่อ
 * pb-28 เพิ่มเติมกันเนื้อหาท้ายจอโดนบัง
 */
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { BottomActionBar } from '@/components/BottomActionBar'
import { GhostButton } from '@/components/GhostButton'
import { Spinner } from '@/components/Spinner'
import { toastError, toastSuccess } from '@/components/toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { formatBahtAmount } from '@/utils/currency'
import { PayslipSection } from '../components/PayslipSection'
import { PayslipSummaryHero } from '../components/PayslipSummaryHero'
import { useEmailPayslip } from '../hooks/useEmailPayslip'
import { usePayslip } from '../hooks/usePayslip'

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

export function PayslipDetailPage() {
  usePageTitle('รายละเอียดสลิปเงินเดือน')
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()

  const { data: detail, isLoading, isError, error, refetch } = usePayslip(id)
  const emailMutation = useEmailPayslip(id)

  function handleSendEmail() {
    emailMutation.mutate(undefined, {
      onSuccess: () => toastSuccess('ส่งอีเมลแล้ว'),
      onError: (err) => toastError(err.message),
    })
  }

  // "ปิด" — กลับไปหน้าก่อนหน้าถ้ามีประวัติจริงในเซสชันนี้ (idx > 0, react-router browser history
  // state) ไม่งั้น fallback ไป `/payroll` (กันเคสเปิดลิงก์ detail ตรง ๆ ไม่มี history ให้ย้อน — มิเรอร์
  // `ApprovalDetailPage.handleClose`, P20)
  function handleClose() {
    const state: unknown = window.history.state
    const idx = state && typeof state === 'object' && 'idx' in state ? state.idx : undefined
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
    } else {
      navigate('/payroll')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 border-primary" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'โหลดรายละเอียดสลิปเงินเดือนไม่สำเร็จ'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <>
      <div className="h-full overflow-y-auto px-4 pt-4 pb-28">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary-dark">เงินเดือน {detail.periodLabel}</h1>
          <button
            type="button"
            aria-label="ส่งสลิปเข้าอีเมล"
            onClick={handleSendEmail}
            disabled={emailMutation.isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-dark disabled:opacity-50"
          >
            <MailIcon />
          </button>
        </div>

        <PayslipSummaryHero detail={detail} />

        <div className="space-y-4">
          <PayslipSection
            title="พนักงานรายวัน"
            dotColor="bg-text-secondary"
            items={[
              { label: 'รหัสพนักงาน', value: detail.employee.code },
              { label: 'ชื่อ-สกุล', value: detail.employee.name },
              { label: 'ตำแหน่ง', value: detail.employee.position },
              { label: 'หน่วยงาน', value: detail.employee.department },
              { label: 'วันที่เข้าทำงาน', value: detail.employee.startDate },
            ]}
          />

          <PayslipSection
            title="รายรับ"
            dotColor="bg-success"
            items={detail.earnings.map((item) => ({
              label: item.label,
              value: formatBahtAmount(item.amount),
            }))}
          />

          <PayslipSection
            title="รายหัก"
            dotColor="bg-warning"
            items={detail.deductions.map((item) => ({
              label: item.label,
              value: formatBahtAmount(item.amount),
            }))}
          />
        </div>
      </div>

      <BottomActionBar
        secondary={
          <GhostButton
            icon={<MailIcon />}
            onClick={handleSendEmail}
            isPending={emailMutation.isPending}
          >
            ส่งเข้าอีเมล
          </GhostButton>
        }
        primary={<GhostButton onClick={handleClose}>ปิด</GhostButton>}
      />
    </>
  )
}
