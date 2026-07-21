/**
 * features/auth/components/AuthGate.tsx — ประตูก่อนเข้า route ที่ต้อง auth (§13.1-13.3)
 *
 * ใช้เป็น layout route (pathless) ครอบทุก route ยกเว้น `/register*` ใน `app/router.tsx` — render
 * `<Outlet/>` เมื่อ silent login สำเร็จเท่านั้น (ผ่าน `useAuthBootstrap`) ไม่ render route ลูกก่อน
 * auth resolve (เทียบ `LiffGate` §20.2): เด้ง `/register` เมื่อ `NEED_REGISTER` (§13.2), โชว์จอ
 * "ติดต่อ HR" เมื่อ `EMPLOYEE_INACTIVE` (§16.2), error อื่นมีปุ่มลองใหม่ (reload ทั้งหน้า —
 * เหมือน LiffGate error state)
 */
import { Navigate, Outlet } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
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

  if (status === 'need_register') {
    return <Navigate to="/register" replace />
  }

  if (status === 'inactive') {
    return <ErrorState message="บัญชีไม่พร้อมใช้งาน กรุณาติดต่อฝ่ายบุคคล (HR)" />
  }

  if (status === 'error') {
    return <ErrorState message="เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่" onRetry={handleReload} />
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface">
        <Spinner className="h-8 w-8 border-primary border-t-transparent" />
        <p className="text-sm text-text-secondary">กำลังเข้าสู่ระบบ...</p>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}
