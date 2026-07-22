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
 * และ `/approval/:id` (P20 — จอ detail + อนุมัติ/ไม่อนุมัติ, ผ่าน `ApprovalDetailPage` ครอบ
 * `ProtectedRoute requireRole="manager"` เดียวกัน)
 * `/payroll` (P21 — จอ 5.1 ประวัติสลิปเงินเดือน read-only, ผ่าน `PayrollRoute` compose ProfileBar —
 * ดู `app/PayrollRoute.tsx`) และ `/payroll/:id` (P21 — จอ 5.2/5.3 รายละเอียด+ส่งอีเมล, ผ่าน
 * `PayrollDetailRoute`) ไม่มี `requireRole` — พนักงานทุกคนมีสลิปตัวเอง (backend 403 กันข้าม id คนอื่น)
 * `createBrowserRouter` (History API — ข้อกำหนด LIFF, §11) + `errorElement` ทุก route
 *
 * route ที่ต้อง auth (ทุกอันยกเว้น `/register*`) อยู่ใต้ layout route ปลาย `AuthGate` (§13.1-13.3)
 * — `AuthGate` เช็ค silent login ก่อนเสมอ ไม่ render route ลูกจนกว่าจะสำเร็จ (เทียบ LiffGate §20.2)
 *
 * **[P22 code-split]** `/leave/new`, `/leave/:id`, `/calendar`, `/approval/:id`, `/payroll`,
 * `/payroll/:id` ใช้ route property `lazy` (react-router v7 — ตัด vaul/Radix/react-day-picker
 * ออกจาก initial bundle) แทน static `element`/import ด้านบน ทุกจุด import **deep path ตรงไฟล์**
 * ไม่ผ่าน barrel (`@/features/<x>` index.ts) เพราะ barrel เดียวกันยังถูก import แบบ static ที่อื่น
 * (`LeaveRoute`→`LeaveShellPage`, `ApprovalRoute`/`LeaveApprovalTopNav`→`ApprovalListPage`/
 * `usePendingRequests`) — ถ้า dynamic import ชนกับ static import ของโมดูลเดียวกัน bundler จะ inline
 * ทันที (`INEFFECTIVE_DYNAMIC_IMPORT`, กับดัก P13 #5) การใช้ deep import ที่นี่จึงไม่ชนทาง static
 * ใดเลย. `/approval/:id` ยังต้องคง `ProtectedRoute requireRole="manager"` — ห่อไว้ *ข้างใน*
 * `Component` ที่ resolve จาก `lazy()` แทน (react-router merge `Component` เข้า route เฉพาะตอนไม่มี
 * `element` ประกาศ static ไว้ก่อน จึงห่อ guardในนี้แทนห่อนอก)
 */
import { createBrowserRouter } from 'react-router-dom'
import { AuthGate, OtpPage, ProtectedRoute, RegisterPage, RegisterSuccessPage } from '@/features/auth'
import { ApprovalRoute } from './ApprovalRoute'
import { AttendanceRoute } from './AttendanceRoute'
import { AttendanceHistoryRoute } from './AttendanceHistoryRoute'
import { HomePage } from './HomePage'
import { LeaveRoute } from './LeaveRoute'
import { NotFoundPage } from './NotFoundPage'
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
        lazy: async () => {
          const { LeaveFormPage } = await import('@/features/leave/pages/LeaveFormPage')
          return { Component: LeaveFormPage }
        },
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/leave/:id',
        lazy: async () => {
          const { LeaveDetailPage } = await import('@/features/leave/pages/LeaveDetailPage')
          return { Component: LeaveDetailPage }
        },
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
        lazy: async () => {
          const { ApprovalDetailPage } = await import('@/features/approval/pages/ApprovalDetailPage')
          return {
            Component: () => (
              <ProtectedRoute requireRole="manager">
                <ApprovalDetailPage />
              </ProtectedRoute>
            ),
          }
        },
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/payroll',
        lazy: async () => {
          const { PayrollRoute } = await import('./PayrollRoute')
          return { Component: PayrollRoute }
        },
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/payroll/:id',
        lazy: async () => {
          const { PayrollDetailRoute } = await import('./PayrollDetailRoute')
          return { Component: PayrollDetailRoute }
        },
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/calendar',
        lazy: async () => {
          const { CalendarShellPage } = await import('@/features/calendar/pages/CalendarShellPage')
          return { Component: CalendarShellPage }
        },
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
