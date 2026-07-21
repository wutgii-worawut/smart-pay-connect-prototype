/**
 * app/RouteErrorBoundary.tsx — `errorElement` มาตรฐานต่อ route (§20.1)
 * พังแค่หน้าเดียว ไม่ล้มทั้งแอป (ต่างจาก ErrorBoundary ระดับแอปที่เป็นตาข่ายสุดท้าย)
 */
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? (error.statusText ?? 'ไม่พบหน้านี้')
    : 'เกิดข้อผิดพลาดในหน้านี้'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
      <p className="text-lg font-semibold text-primary-dark">เกิดข้อผิดพลาด</p>
      <p className="text-sm text-text-secondary">{message}</p>
      <Link
        to="/"
        replace
        className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white"
      >
        กลับหน้าแรก
      </Link>
    </div>
  )
}
