/**
 * app/router.tsx — router (§12.3) ทุก route ยัง placeholder จนกว่าจะถึงเฟส feature จริง ยกเว้น
 * auth (P8) + `/register`, `/register/otp`, `/register/success` (P9+P10 — จอ 1.1-1.4 ครบวง),
 * `/attendance` (P12 — จอ 0-9 ครบวง, ผ่าน `AttendanceRoute` ที่ compose ProfileBar+ClockPage แบบ
 * lazy — ดู `app/AttendanceRoute.tsx`) และ `/attendance/history` (P13 — จอ 10.History, ผ่าน
 * `AttendanceHistoryRoute` — ดู `app/AttendanceHistoryRoute.tsx`)
 * `/leave` (P14 — จอ balance/pending/history, ผ่าน `LeaveShellPage`; P19 เปลี่ยน element เป็น
 * `LeaveRoute` ที่ compose แท็บบนสุด "การลาของฉัน | รออนุมัติ (n)" เฉพาะ manager ครอบ
 * `LeaveShellPage` อีกที — ดู `app/LeaveRoute.tsx`) และ `/leave/:id` (P15 — จอ detail + ยกเลิก
 * PENDING, ผ่าน `LeaveDetailPage`) และ `/leave/new` (P16 — จอ 6.1/6.2 สร้างใบลา → จอ 7 สำเร็จแบบ
 * in-page state ในไฟล์เดียวกัน, ผ่าน `LeaveFormPage`)
 * `/approval` (P19 — จอ pending/history ฝั่งหัวหน้า, ผ่าน `ApprovalRoute` — ดู `app/ApprovalRoute.tsx`
 * ครอบด้วย `ProtectedRoute requireRole="manager"` เป็น UI guard ชั้นสอง §17.3, backend 403 = ตัวจริง)
 * `createBrowserRouter` (History API — ข้อกำหนด LIFF, §11) + `errorElement` ทุก route
 *
 * route ที่ต้อง auth (ทุกอันยกเว้น `/register*`) อยู่ใต้ layout route ปลาย `AuthGate` (§13.1-13.3)
 * — `AuthGate` เช็ค silent login ก่อนเสมอ ไม่ render route ลูกจนกว่าจะสำเร็จ (เทียบ LiffGate §20.2)
 */
import { createBrowserRouter } from 'react-router-dom'
import { AuthGate, OtpPage, ProtectedRoute, RegisterPage, RegisterSuccessPage } from '@/features/auth'
import { CalendarShellPage } from '@/features/calendar'
import { LeaveDetailPage, LeaveFormPage } from '@/features/leave'
import { ApprovalRoute } from './ApprovalRoute'
import { AttendanceRoute } from './AttendanceRoute'
import { AttendanceHistoryRoute } from './AttendanceHistoryRoute'
import { HomePage } from './HomePage'
import { LeaveRoute } from './LeaveRoute'
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
        element: <AttendanceRoute />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/attendance/history',
        element: <AttendanceHistoryRoute />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave',
        element: <LeaveRoute />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave/new',
        element: <LeaveFormPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave/:id',
        element: <LeaveDetailPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/approval',
        element: (
          <ProtectedRoute requireRole="manager">
            <ApprovalRoute />
          </ProtectedRoute>
        ),
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
        element: <CalendarShellPage />,
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
    element: <OtpPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register/success',
    element: <RegisterSuccessPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorBoundary />,
  },
])
