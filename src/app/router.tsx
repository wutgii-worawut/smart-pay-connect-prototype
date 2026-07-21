/**
 * app/router.tsx — router (§12.3) ทุก route ยัง placeholder จนกว่าจะถึงเฟส feature จริง ยกเว้น
 * auth (P8) + `/register` (P9 — จอ 1.1/1.2, `/register/otp`+`/register/success` ยัง placeholder
 * รอ P10) `createBrowserRouter` (History API — ข้อกำหนด LIFF, §11) + `errorElement` ทุก route
 *
 * route ที่ต้อง auth (ทุกอันยกเว้น `/register*`) อยู่ใต้ layout route ปลาย `AuthGate` (§13.1-13.3)
 * — `AuthGate` เช็ค silent login ก่อนเสมอ ไม่ render route ลูกจนกว่าจะสำเร็จ (เทียบ LiffGate §20.2)
 */
import { createBrowserRouter } from 'react-router-dom'
import { AuthGate, RegisterPage } from '@/features/auth'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { PlaceholderPage } from './PlaceholderPage'
import { RouteErrorBoundary } from './RouteErrorBoundary'

export const router = createBrowserRouter([
  {
    element: <AuthGate />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <HomePage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/attendance',
        element: <PlaceholderPage title="ลงเวลาทำงาน" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/attendance/history',
        element: <PlaceholderPage title="ประวัติลงเวลา" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave',
        element: <PlaceholderPage title="บันทึกการลา" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave/new',
        element: <PlaceholderPage title="ยื่นใบลา" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave/:id',
        element: <PlaceholderPage title="รายละเอียดใบลา" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/approval/:id',
        element: <PlaceholderPage title="อนุมัติใบลา" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/payroll',
        element: <PlaceholderPage title="ดูสลิปเงินเดือน" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/payroll/:id',
        element: <PlaceholderPage title="รายละเอียดสลิปเงินเดือน" />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/calendar',
        element: <PlaceholderPage title="ดูวันหยุด" />,
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register/otp',
    element: <PlaceholderPage title="ยืนยัน OTP" />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register/success',
    element: <PlaceholderPage title="ลงทะเบียนสำเร็จ" />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorBoundary />,
  },
])
