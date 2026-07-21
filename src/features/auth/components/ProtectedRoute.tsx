/**
 * features/auth/components/ProtectedRoute.tsx — guard สำหรับ route ที่ต้อง auth แล้ว (§13, §17.3)
 *
 * เป็นชั้นป้องกันซ้ำใน UI (ตัวจริงคือ backend 403 เสมอ — §17.3) ปกติ `AuthGate` (parent layout
 * route) block ไม่ให้ `<Outlet/>` render จนกว่า silent login สำเร็จอยู่แล้ว component นี้เผื่อไว้
 * 2 กรณี: 1) defense-in-depth เผื่อ `isAuthenticated` หลุด false ระหว่างอยู่หน้าใดหน้าหนึ่ง
 * (เช่น `onUnauthorized` ล้าง session กลางทาง) 2) เตรียม role gate (`requireRole="manager"`)
 * ให้ P19 approval route ใช้ต่อได้ทันที — **P8 ยังไม่มี route ไหนส่ง `requireRole` จริง**
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { EmployeeRole } from '../types/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: EmployeeRole
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const employeeRole = useAuthStore((state) => state.employee?.role)

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (requireRole && employeeRole !== requireRole) {
    return <Navigate to="/" replace />
  }

  return children
}
