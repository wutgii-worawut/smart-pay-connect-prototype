/**
 * features/auth/hooks/useAuthBootstrap.ts — flow §13.1/§13.2 ครั้งเดียวตอนแอปเปิด
 *
 * getIDToken (จาก LIFF ที่ ready แล้ว — caller ส่ง `idToken` เข้ามา ไม่แตะ `useLiff()` ในนี้)
 * → `login()` ผ่าน `useMutation` (retry:0 จาก query-client default, §20.4) → แยกสถานะให้
 * component ที่ใช้ (เช่น `AuthGate`) ตัดสินใจ render/navigate ต่อ — hook นี้ไม่แตะ react-router
 * เลย จึงเทสต์ได้ด้วย `renderHook` โดยไม่ต้องมี Router ครอบ (testing.md ข้อ 2)
 */
import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { login, type LoginResult } from '../api/login'
import { useAuthStore } from '../stores/authStore'

export type AuthBootstrapStatus = 'checking' | 'ready' | 'need_register' | 'inactive' | 'error'

export function useAuthBootstrap(idToken: string | null): AuthBootstrapStatus {
  const setSession = useAuthStore((state) => state.setSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const startedRef = useRef(false)
  const wasAuthenticatedRef = useRef(isAuthenticated)

  const mutation = useMutation<LoginResult, ApiError, string>({
    mutationFn: login,
    onSuccess: (result) => {
      if (result.status === 'authenticated') {
        setSession(result.token, result.employee)
      }
    },
  })

  const { mutate } = mutation

  // F1 must-fix (consultant review): เซสชันหลุดกลางทาง (เช่น `onUnauthorized` เรียก
  // `clearSession()` ตอน backend endpoint อื่นตอบ UNAUTHORIZED, §13.1/§16.2) ทำให้
  // `isAuthenticated` true→false — `startedRef` เดิมกันไม่ให้ effect ด้านล่างยิงซ้ำมาแต่ต้น
  // (ถูกต้องสำหรับ mount รอบแรก) แต่ทำให้กรณีนี้ค้าง status 'checking' ตลอดไปเพราะไม่มีอะไรมา
  // reset ให้ยิง login ใหม่ — เช็ค transition true→false แล้ว reset `startedRef` เพื่อให้ effect
  // ถัดไปยิง silent login รอบใหม่ทันที (ไม่ loop: ถ้า re-login ล้มเหลวจริง → `isError` → จอ error
  // มีปุ่มลองใหม่; ถ้า idToken หมดอายุ → ID_TOKEN_EXPIRED → logout+login redirect ตาม §13.3)
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      startedRef.current = false
    }
    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated || startedRef.current || !idToken) return
    startedRef.current = true
    mutate(idToken)
  }, [idToken, isAuthenticated, mutate])

  if (isAuthenticated) return 'ready'

  if (mutation.data?.status === 'need_register') return 'need_register'

  if (mutation.isError) {
    const error = mutation.error
    if (error instanceof ApiError && error.code === 'EMPLOYEE_INACTIVE') return 'inactive'
    // F2 (consultant review): ID_TOKEN_EXPIRED ทำให้ interceptor เรียก liff.logout()+liff.login()
    // อยู่แล้ว (§13.3 — redirect ทั้งหน้า) การขึ้นจอ error 1 เฟรมก่อน redirect แค่กระพริบไม่มี
    // ประโยชน์ (ปุ่ม "ลองใหม่" ก็แค่ reload ซึ่งกำลังจะเกิดเองจาก redirect) → ค้าง 'checking' รอ
    // redirect แทน
    if (error instanceof ApiError && error.code === 'ID_TOKEN_EXPIRED') return 'checking'
    return 'error'
  }

  // ไม่มี idToken ให้ยิงเลย (ผิดปกติ — LIFF ready แล้วแต่ getIDToken() คืน null) → ไม่ต้องรอเฉย ๆ
  if (!idToken) return 'error'

  return 'checking'
}
