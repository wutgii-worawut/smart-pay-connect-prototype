/**
 * features/auth/stores/registerStore.ts — เก็บ email/refCode ระหว่างขั้นตอน register→OTP
 * (feature-plans/01 §1.1→§1.3, Zustand — client state ข้าม page ตามกฎเหล็ก §8.2)
 *
 * `RegisterForm` (P9) เรียก `setPendingOtp()` หลัง `POST /auth/register/request-otp` สำเร็จ ก่อน
 * navigate ไป `/register/otp` — `OtpPage` (P10) อ่านค่านี้มาแสดง chip อีเมล + เลขอ้างอิง ไม่ persist
 * (เหมือน authStore): ปิด LIFF/รีเฟรชกลางทางแล้วหาย ต้องเริ่ม request-otp ใหม่
 * (P10 ต้อง guard: ถ้า `pendingOtp` เป็น null ตอนเปิด `/register/otp` ตรง ๆ ให้เด้งกลับ `/register`)
 */
import { create } from 'zustand'

export interface PendingOtp {
  email: string
  refCode: string
}

interface RegisterState {
  pendingOtp: PendingOtp | null
  setPendingOtp: (data: PendingOtp) => void
  clearPendingOtp: () => void
}

export const useRegisterStore = create<RegisterState>((set) => ({
  pendingOtp: null,
  setPendingOtp: (data) => set({ pendingOtp: data }),
  clearPendingOtp: () => set({ pendingOtp: null }),
}))
