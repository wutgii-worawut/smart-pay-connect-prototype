/**
 * app/NotFoundPage.tsx — catch-all route (`*`) กันจอ error ของ React Router เวลาเจอ path
 * ที่ไม่มีในตาราง §12.3 (พิมพ์ผิด/ลิงก์เก่า) — พาไปหน้าแรกได้
 */
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('ไม่พบหน้า')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
      <p className="text-lg font-semibold text-primary-dark">ไม่พบหน้าที่ต้องการ</p>
      <p className="text-sm text-text-secondary">ลิงก์นี้อาจไม่ถูกต้องหรือหมดอายุแล้ว</p>
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
