/**
 * app/router.tsx — router skeleton (§12.3) ทุก route เป็น placeholder จนกว่าจะถึงเฟส feature
 * จริง (P8+) `createBrowserRouter` (History API — ข้อกำหนด LIFF, §11) + `errorElement` ทุก route
 */
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { PlaceholderPage } from './PlaceholderPage'
import { RouteErrorBoundary } from './RouteErrorBoundary'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register',
    element: <PlaceholderPage title="ลงทะเบียน" />,
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
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorBoundary />,
  },
])
