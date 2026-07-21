/**
 * features/auth/stores/authStore.ts — client state ของ session (Zustand, §8.2)
 *
 * ไม่ persist (ไม่ใช้ middleware `persist`) — token อยู่ในหน่วยความจำเท่านั้นตามที่ §13.1 แนะนำ
 * เป็นทางเลือกปลอดภัยสุด: ปิด LIFF/รีเฟรชแล้วหายหมด เปิดใหม่ต้อง silent login ใหม่ทุกครั้ง
 */
import { create } from 'zustand'
import { setAuthToken } from '@/lib/api-client'
import type { Employee } from '../types/auth'

interface AuthState {
  token: string | null
  employee: Employee | null
  isAuthenticated: boolean
  /** login สำเร็จ — sync เข้า axios ผ่าน `setAuthToken()` ในจุดเดียวกับที่ set state กันลืม sync ที่ใดที่หนึ่ง */
  setSession: (token: string, employee: Employee) => void
  /** UNAUTHORIZED/MISSING_TOKEN/INVALID_TOKEN (§16.2, เรียกผ่าน `setOnUnauthorized`) หรือ logout เอง */
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  employee: null,
  isAuthenticated: false,
  setSession: (token, employee) => {
    setAuthToken(token)
    set({ token, employee, isAuthenticated: true })
  },
  clearSession: () => {
    setAuthToken(null)
    set({ token: null, employee: null, isAuthenticated: false })
  },
}))
