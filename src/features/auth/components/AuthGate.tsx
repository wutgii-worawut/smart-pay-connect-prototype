/**
 * features/auth/components/AuthGate.tsx — ประตูก่อนเข้า route ที่ต้อง auth (§13.1-13.3, P23 Figma stepper)
 *
 * ใช้เป็น layout route (pathless) ครอบทุก route ยกเว้น `/register*` ใน `app/router.tsx` — render
 * `<Outlet/>` เมื่อ silent login สำเร็จเท่านั้น (ผ่าน `useAuthBootstrap`) ไม่ render route ลูกก่อน
 * auth resolve (เทียบ `LiffGate` §20.2): เด้ง `/register` เมื่อ `NEED_REGISTER` (§13.2), โชว์จอ
 * "ติดต่อ HR" เมื่อ `EMPLOYEE_INACTIVE` (§16.2, ไม่ใช่ error ของ stepper — คงจอเดิม), error อื่น
 * (`checking`/`error`) โชว์เป็นขั้น 2 ของ 2 ใน BootstrapProgress (การ์ดเดียวกับ LiffGate ขั้น 1) —
 * error มีปุ่มลองใหม่ (reload ทั้งหน้า)
 *
 * ก่อนโชว์การ์ด checking หน่วง 300ms ผ่าน useDelayedReveal (latch เดียวกับ LiffGate กันกระพริบซ้ำ
 * ตอน gate ที่ 1 → 2 ต่อกัน) — error โชว์ทันทีไม่รอ delay
 */
import { Navigate, Outlet } from 'react-router-dom'
import { BootstrapProgress } from '@/components/BootstrapProgress'
import { ErrorState } from '@/components/ErrorState'
import { useDelayedReveal } from '@/hooks/useDelayedReveal'
import { useLiff } from '@/lib/liff/useLiff'
import { useAuthBootstrap } from '../hooks/useAuthBootstrap'
import { ProtectedRoute } from './ProtectedRoute'

function handleReload(): void {
  window.location.reload()
}

export function AuthGate() {
  const liffState = useLiff()
  // AuthGate render ได้ก็ต่อเมื่อ LiffGate ปล่อยผ่านแล้ว (status 'ready' เสมอในทางปฏิบัติ) — เช็ค
  // ซ้ำเพื่อ narrow type แทนการ `as`/`!` (code-style: ห้าม type assertion ปิด error)
  const idToken = liffState.status === 'ready' ? liffState.liff.getIDToken() : null
  const status = useAuthBootstrap(idToken)
  const revealed = useDelayedReveal()

  if (status === 'need_register') {
    return <Navigate to="/register" replace />
  }

  if (status === 'inactive') {
    return <ErrorState message="บัญชีไม่พร้อมใช้งาน กรุณาติดต่อฝ่ายบุคคล (HR)" />
  }

  if (status === 'error') {
    return (
      <BootstrapProgress
        step={2}
        title="เข้าสู่ระบบไม่สำเร็จ"
        error={{ message: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่', onRetry: handleReload }}
      />
    )
  }

  if (status === 'checking') {
    if (!revealed) {
      return <div className="min-h-screen bg-surface" />
    }
    return (
      <BootstrapProgress
        step={2}
        title="กำลังตรวจสอบสิทธิ์..."
        description="กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์"
      />
    )
  }

  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}
