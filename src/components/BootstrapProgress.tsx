/**
 * components/BootstrapProgress.tsx — จอ "ขั้นตอนการเชื่อมต่อ" ระหว่าง bootstrap ของ LIFF (P23)
 *
 * ใช้แทนจอ spinner เดิมของ LiffGate (`lib/liff/`, ขั้น 1 = liff.init) และ AuthGate
 * (`features/auth/`, ขั้น 2 = getIDToken + POST /auth/login) — กฎเหล็ก §6: `lib/` ห้าม import จาก
 * `features/` เพราะฉะนั้น component ที่ทั้งสองฝั่งใช้ร่วมกันต้องอยู่ `src/components/` เท่านั้น
 *
 * presentational ล้วน — ห้าม useQuery/useMutation/navigate/useLiff ในไฟล์นี้ (caller ป้อน state
 * ผ่าน props ทั้งหมด) ดีไซน์อ้างอิง docs/design/LINE-OA/liff_init.jpg แต่จงใจตัดขั้น "เข้าสู่ระบบ/
 * รอการยืนยัน" ออก (มีแค่ 3 ขั้นใน JPG) เพราะขั้นนั้นไม่มีงาน async รองรับจริง — login สำเร็จ = render
 * แอปทันที ไม่มีสถานะระหว่างกลางให้แสดง คงไว้จะเป็นแถบปลอม
 *
 * deviation อีกจุด (ผู้ใช้เคาะ 2026-07-30): jpg มี spinner วงใหญ่กลางจอเหนือการ์ด แต่เราตัดออกจากโค้ด
 * นี้จริง ๆ — สาเหตุคือบนเครื่องจริง ตอนเปลี่ยน mount จาก LiffGate (ขั้น 1) ไป AuthGate (ขั้น 2) เป็นคนละ
 * DOM instance กัน spinner วงใหญ่ตัวนี้ถูก unmount/remount ใหม่ทำให้ `animate-spin` รีสตาร์ทมุมจาก 0deg
 * ทุกครั้ง เห็นเป็นอาการกระพริบ/กระตุก ซ้ำซ้อนกับ spinner เล็กที่อยู่ในวงกลมของขั้น active อยู่แล้ว (ดู
 * `StepIcon` status === 'active') ซึ่งไม่มีปัญหานี้เพราะข้อความ/ไอคอนราย step sync กับ status ที่ถูกต้อง
 * เสมอไม่ว่าจะ remount กี่รอบ จึงตัดวงใหญ่ทิ้งแล้วให้วงเล็กในการ์ดสื่อสถานะ "กำลังทำงาน" แทนอย่างเดียว
 *
 * ปุ่ม "ลองใหม่" ไม่ใช้ `primaryButtonClass('pill')` ตรง ๆ เพราะ helper บังคับ `w-full px-6 py-4
 * text-base` (ขนาดปุ่มหลักเต็มจอ) แต่ปุ่มนี้ต้อง compact ตาม design (inline เล็กใต้การ์ด) — ห่อด้วย
 * `PrimaryButton` แบบ ErrorState.tsx ก็ยังได้ py-4/text-base ติดมา ไม่ตรง JPG เท่าคง class เดิม จึง
 * คุม layout เอง แต่ดึง `FOCUS_VISIBLE_RING_CLASS` จาก buttonClasses.ts มาแปะแทนการประดิษฐ์ ring ใหม่
 */
import { FOCUS_VISIBLE_RING_CLASS } from './buttonClasses'

interface BootstrapProgressProps {
  /** ขั้นที่กำลังทำอยู่ (หรือขั้นที่ error ถ้ามี `error`) */
  step: 1 | 2
  /** หัวข้อใหญ่กลางจอ */
  title: string
  /** คำโปรยใต้หัวข้อ */
  description?: string
  /** มี = โหมด error (ขั้น `step` กลายเป็นสีแดง, ข้อความสถานะขั้นนั้นเปลี่ยนเป็น role="alert", โชว์ปุ่มลองใหม่ถ้ามี onRetry) */
  error?: { message: string; onRetry?: () => void }
}

type StepStatus = 'done' | 'active' | 'pending' | 'error'

const STEP_LABELS: Record<1 | 2, { label: string; activeText: string }> = {
  1: { label: 'เชื่อมต่อกับ LINE', activeText: 'กำลังเตรียม LINE LIFF...' },
  2: { label: 'ตรวจสอบสิทธิ์การเข้าถึง', activeText: 'กำลังตรวจสอบสิทธิ์...' },
}

const DONE_TEXT = 'สำเร็จ'
const PENDING_TEXT = 'รอดำเนินการ...'

function getStepStatus(index: 1 | 2, currentStep: 1 | 2, hasError: boolean): StepStatus {
  if (index < currentStep) {
    return 'done'
  }
  if (index === currentStep) {
    return hasError ? 'error' : 'active'
  }
  return 'pending'
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-white"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-text-secondary"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-white"
      aria-hidden="true"
    >
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
        <CheckIcon />
      </span>
    )
  }
  if (status === 'active') {
    // spinner ตกแต่งของแต่ละขั้น — ไม่ใช้ shared `Spinner` (มี role="status" + aria-label ตายตัวติดมา)
    // เพราะจะซ้ำ live region กับ role="status" ของ StepStatusText ที่ประกาศสถานะขั้นนี้อยู่แล้ว (จอนี้ตั้งใจ
    // ให้เหลือ live region เดียว — ดู doc-comment หัวไฟล์); ตัวหมุนนี้จึงเป็นแค่ decorative จริง ๆ
    // ทำ `aria-hidden` ให้ AT ข้ามไป สถานะของแถวนี้สื่อผ่านข้อความ role="status" ใน StepStatusText แทน
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger">
        <ErrorIcon />
      </span>
    )
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-text-secondary/15">
      <LockIcon />
    </span>
  )
}

function StepStatusText({
  status,
  activeText,
  errorMessage,
}: {
  status: StepStatus
  activeText: string
  errorMessage?: string
}) {
  const text =
    status === 'done'
      ? DONE_TEXT
      : status === 'active'
        ? activeText
        : status === 'error'
          ? (errorMessage ?? '')
          : PENDING_TEXT

  const colorClass =
    status === 'error' ? 'text-danger' : status === 'pending' ? 'text-text-secondary' : 'text-primary'

  // role="status" (polite + atomic บนบรรทัดเดียว) ใส่เฉพาะแถวที่ active เท่านั้น — เป็นแถวเดียวที่มีข้อมูล
  // "กำลังเกิดขึ้นตอนนี้" ให้ประกาศจริง ๆ; แถว done/pending เป็นข้อความสถิต (ไม่เคยเปลี่ยนระหว่างที่มองเห็น
  // ภายใน mount เดียว) ใส่ role="status" ด้วยจะกลายเป็น live region ซ้อนกันหลายอันโดยไม่มีประโยชน์ (และ
  // ทำให้ query ด้วย role เดียวกำกวม) โหมด error ใช้ role="alert" (assertive) แทน status (polite) เพราะ
  // สำคัญกว่าต้องขัดจังหวะทันที — จอนี้จึงมี live region เดียวเสมอไม่ว่าจะ step ไหน (ดู doc-comment หัวไฟล์
  // + BootstrapProgress ด้านล่างที่ไม่มี role อีกแล้ว)
  return (
    <p
      className={`text-sm ${colorClass}`}
      role={status === 'error' ? 'alert' : status === 'active' ? 'status' : undefined}
    >
      {text}
    </p>
  )
}

export function BootstrapProgress({ step, title, description, error }: BootstrapProgressProps) {
  const hasError = Boolean(error)

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface px-6 pt-16 pb-safe">
      <h1 className="text-center text-lg font-semibold text-primary-dark">{title}</h1>
      {description ? (
        <p className="mt-2 text-center text-sm text-text-secondary">{description}</p>
      ) : null}

      <div className="mt-8 w-full max-w-sm rounded-card bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-primary-dark">ขั้นตอนการเชื่อมต่อ</h2>

        <ol className="mt-4">
          {([1, 2] as const).map((index) => {
            const status = getStepStatus(index, step, hasError && index === step)
            const isLast = index === 2
            const meta = STEP_LABELS[index]
            const isActiveRow = status === 'active'

            return (
              <li key={index} className={`relative flex gap-4 ${isLast ? '' : 'pb-6'}`}>
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-12 left-6 h-6 w-0.5 -translate-x-1/2 bg-text-secondary/20"
                  />
                ) : null}
                <StepIcon status={status} />
                <div
                  className={`flex-1 rounded-card px-3 py-2 ${isActiveRow ? 'bg-surface' : ''}`}
                >
                  <p
                    className={`font-medium ${status === 'error' ? 'text-danger' : 'text-primary-dark'}`}
                  >
                    {meta.label}
                  </p>
                  <StepStatusText
                    status={status}
                    activeText={meta.activeText}
                    errorMessage={status === 'error' ? error?.message : undefined}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {hasError && error?.onRetry ? (
        <button
          type="button"
          onClick={error.onRetry}
          className={`mt-6 rounded-full bg-primary px-6 py-2 text-sm font-medium text-white transition-opacity ${FOCUS_VISIBLE_RING_CLASS}`}
        >
          ลองใหม่
        </button>
      ) : null}
    </div>
  )
}
