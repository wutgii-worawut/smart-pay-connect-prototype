/**
 * features/auth/index.ts — public API ของ auth feature (กฎเหล็ก §6 ข้อ 3 — minimal barrel)
 *
 * import ไฟล์นี้ (เช่นจาก `app/router.tsx`) รัน `registerAuthCallbacks()` ทันทีเป็น module
 * side-effect ครั้งเดียว — ต้องเกิดก่อน API call แรกของแอป ซึ่งเป็นจริงเพราะ router.tsx import
 * `AuthGate` จากที่นี่ตั้งแต่ระดับบนสุดของโมดูล ก่อน `RouterProvider` จะ render/ยิง request ใด ๆ
 */
import { registerAuthCallbacks } from './registerAuthCallbacks'

registerAuthCallbacks()

export { AuthGate } from './components/AuthGate'
export { ProtectedRoute } from './components/ProtectedRoute'
export { OtpPage } from './pages/OtpPage'
export { RegisterPage } from './pages/RegisterPage'
export { RegisterSuccessPage } from './pages/RegisterSuccessPage'
export { useAuthStore } from './stores/authStore'
export type { Employee, EmployeeRole } from './types/auth'
