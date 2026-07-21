/**
 * lib/liff/LiffGate.tsx — ประตูก่อนเข้าแอปจริง (§20.2)
 *
 * 3 สถานะ: loading (กำลัง init) / ready (render children) / error (init ล้มเหลว —
 * ต้องมีข้อความ+ปุ่มลองใหม่ ห้ามหมุนค้างตลอดกาล) ห้าม render router ก่อน init resolve (§12.1)
 */
import type { ReactNode } from 'react'
import { useLiff } from './useLiff'

function handleRetry(): void {
  window.location.reload()
}

export function LiffGate({ children }: { children: ReactNode }) {
  const state = useLiff()

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface">
        <div
          role="status"
          aria-label="กำลังโหลด"
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
        <p className="text-sm text-text-secondary">กำลังโหลด...</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-primary-dark">เปิดแอปไม่สำเร็จ</p>
        <p className="text-sm text-text-secondary">
          กรุณาเปิดผ่านแอป LINE หรือลองใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white"
        >
          ลองใหม่
        </button>
      </div>
    )
  }

  return children
}
