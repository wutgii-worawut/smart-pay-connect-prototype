/**
 * lib/liff/LiffGate.tsx — ประตูก่อนเข้าแอปจริง (§20.2, P23 Figma stepper)
 *
 * 3 สถานะ: loading (กำลัง init, ขั้น 1 ของ 2 ใน BootstrapProgress) / ready (render children) /
 * error (init ล้มเหลว — ต้องมีข้อความ+ปุ่มลองใหม่ ในการ์ดเดียวกัน ห้ามหมุนค้างตลอดกาล) ห้าม render
 * router ก่อน init resolve (§12.1)
 *
 * ก่อนโชว์การ์ด loading หน่วง 300ms ผ่าน useDelayedReveal กัน flash (bootstrap จริงมัก <1s) —
 * error โชว์ทันทีไม่รอ delay
 */
import type { ReactNode } from 'react'
import { BootstrapProgress } from '@/components/BootstrapProgress'
import { useDelayedReveal } from '@/hooks/useDelayedReveal'
import { useLiff } from './useLiff'

function handleRetry(): void {
  window.location.reload()
}

export function LiffGate({ children }: { children: ReactNode }) {
  const state = useLiff()
  const revealed = useDelayedReveal()

  if (state.status === 'loading') {
    if (!revealed) {
      return <div className="min-h-screen bg-surface" />
    }
    return (
      <BootstrapProgress step={1} title="กำลังเชื่อมต่อกับ LINE..." description="กรุณารอสักครู่" />
    )
  }

  if (state.status === 'error') {
    return (
      <BootstrapProgress
        step={1}
        title="เปิดแอปไม่สำเร็จ"
        description="กรุณาเปิดผ่านแอป LINE หรือลองใหม่อีกครั้ง"
        error={{ message: 'เชื่อมต่อ LINE ไม่สำเร็จ', onRetry: handleRetry }}
      />
    )
  }

  return children
}
