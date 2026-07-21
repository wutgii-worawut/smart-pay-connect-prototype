/**
 * components/Toaster.tsx — S7 Toast (feature-plans/00 §1 S7, §20.4-20.5)
 * pill เข้มลอยล่าง + ไอคอนวงกลมเขียว/แดง ตาม design (3.Leave "Sended Cancel Pending Request",
 * 4.Leave Approval "Approve/Reject - Success") — ใช้กับผลลัพธ์ mutation เท่านั้น
 * (query error ใช้ <ErrorState> แทนเนื้อหา — ห้าม toast ตาม §20.4)
 *
 * ติดตั้งผ่าน `npm install sonner` ตรง ๆ (ไม่ผ่าน shadcn CLI — ดูหมายเหตุท้ายไฟล์นี้/รายงานผล P4)
 * mount <AppToaster /> ครั้งเดียวที่ app root (app/providers.tsx) แล้วเรียก toastSuccess/toastError
 * จาก components/toast.ts จาก feature ไหนก็ได้ (mutation onSuccess/onError)
 *
 * วิธี custom: ใช้ toast.custom() แทน toast.success()/toast.error() ทั้งหมด (ดู components/toast.ts)
 * — เพราะ sonner บังคับ toast กว้างเต็มจอบนมือถือ (breakpoint ≤600px, ควบคุมผ่าน props ไม่ได้)
 * การ custom เองทำให้ <li> ของ sonner กลายเป็นกรอบมองไม่เห็น (เต็มความกว้างตามเดิม) แล้วเราจัดกึ่งกลาง
 * (justify-center) ตัว pill ที่มองเห็นจริง (ToastPill) จะหุบตามเนื้อหา (fit-content) โดยไม่ต้องง้อ
 * !important/inline style
 *
 * หมายเหตุ: toastSuccess/toastError แยกไปไว้ components/toast.ts (ไม่ใช่ไฟล์นี้) เพราะ
 * eslint-plugin-react-refresh (only-export-components) ห้ามไฟล์เดียวกันมี export ทั้ง component
 * และ function ธรรมดาปนกัน
 */
import { Toaster as SonnerToaster } from 'sonner'

export type ToastTone = 'success' | 'error'

function ToastIcon({ tone }: { tone: ToastTone }) {
  const isSuccess = tone === 'success'
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        isSuccess ? 'bg-success' : 'bg-danger'
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        {isSuccess ? <path d="M5 10l3 3 7-7" /> : <path d="M6 6l8 8M14 6l-8 8" />}
      </svg>
    </span>
  )
}

/** ใช้จาก components/toast.ts (toastSuccess/toastError) */
export function ToastPill({ message, tone }: { message: string; tone: ToastTone }) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-primary-dark px-5 py-3 text-white shadow-card">
      <ToastIcon tone={tone} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}

export function AppToaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={3000}
      offset={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      // sonner v2 เมิน offset ที่ viewport ≤600px — ต้องส่ง mobileOffset แยกด้วย (ไม่งั้น toast ทับ
      // home indicator/BottomActionBar บนมือถือจริงทุกเครื่อง เพราะ LINE in-app browser คือมือถือเสมอ)
      mobileOffset={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      toastOptions={{
        classNames: {
          // <li> ของ sonner ถูกบังคับเต็มความกว้างบนมือถือ — ทำให้โปร่งใส + จัดกึ่งกลาง
          // ตัว pill ที่เห็นจริงมาจาก ToastPill (หุบตามเนื้อหาเพราะเป็น flex item ไม่ set width)
          toast: 'flex w-full justify-center',
        },
      }}
    />
  )
}
