/**
 * components/ErrorState.tsx — แทนที่เนื้อหาทั้งก้อนเมื่อ useQuery error (S18, §20.4)
 * ห้ามใช้ toast กับ query error (toast หายแล้วผู้ใช้ค้างกับหน้าว่าง) — ใช้ ErrorState แทนเนื้อหาแทน
 */
import { PrimaryButton } from './PrimaryButton'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 text-danger"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <div className="w-40">
          <PrimaryButton onClick={onRetry}>ลองใหม่</PrimaryButton>
        </div>
      ) : null}
    </div>
  )
}
