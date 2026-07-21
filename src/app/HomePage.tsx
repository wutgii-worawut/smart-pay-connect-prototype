/**
 * app/HomePage.tsx — หน้าแรก (route `/`) ดักอ่าน `?target=` แล้ว redirect (§12.1, §12.3)
 * ทำงานหลัง LiffGate ปล่อยผ่านแล้วเท่านั้น (HomePage อยู่ใต้ RouterProvider ซึ่ง render
 * ต่อเมื่อ LiffGate เป็น ready)
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'

// รวม 'calendar' ตามหมายเหตุ §12.3 — Rich Menu ผูก ?target=attendance|leave|payroll|calendar
const TARGET_WHITELIST = ['attendance', 'leave', 'payroll', 'calendar'] as const
type TargetRoute = (typeof TARGET_WHITELIST)[number]

function isTargetRoute(value: string | null): value is TargetRoute {
  return value !== null && TARGET_WHITELIST.some((target) => target === value)
}

export function HomePage() {
  usePageTitle('หน้าแรก')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const target = searchParams.get('target')
    if (isTargetRoute(target)) {
      navigate(`/${target}`, { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface p-6 text-center">
      <p className="text-lg font-semibold text-primary-dark">SmartPay Connect</p>
      <p className="text-sm text-text-secondary">เลือกเมนูจาก Rich Menu ของ LINE เพื่อเริ่มใช้งาน</p>
    </div>
  )
}
