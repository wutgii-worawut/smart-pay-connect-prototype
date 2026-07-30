/**
 * features/auth/hooks/useAuthBootstrap.ts — flow §13.1/§13.2 ครั้งเดียวตอนแอปเปิด
 *
 * getIDToken (จาก LIFF ที่ ready แล้ว — caller ส่ง `idToken` เข้ามา ไม่แตะ `useLiff()` ในนี้)
 * → `login()` ผ่าน `useMutation` (retry:0 จาก query-client default, §20.4) → แยกสถานะให้
 * component ที่ใช้ (เช่น `AuthGate`) ตัดสินใจ render/navigate ต่อ — hook นี้ไม่แตะ react-router
 * เลย จึงเทสต์ได้ด้วย `renderHook` โดยไม่ต้องมี Router ครอบ (testing.md ข้อ 2)
 */
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { login, type LoginResult } from '../api/login'
import { useAuthStore } from '../stores/authStore'

export type AuthBootstrapStatus = 'checking' | 'ready' | 'need_register' | 'inactive' | 'error'

/** จำนวนรอบ re-login ที่ "เร็วผิดปกติ" (ดู `LOOP_WINDOW_MS`) ติดกันที่ยอมให้ผ่านก่อนตัดสินว่าเป็น
 *  ลูปไม่รู้จบแล้วหยุด — 2 ครั้งเผื่อ noise ชั่วครู่ (network hiccup ตอน backend restart) ไม่ตัดสิทธิ์
 *  ผู้ใช้ทันทีที่รอบเดียว แต่ก็ไม่มากจนปล่อยยิง POST /auth/login รัวใส่ backend ไม่มีเพดาน */
const MAX_FAST_RELOGIN_ATTEMPTS = 2

/** เกณฑ์ตัดสินว่า session ที่หลุด "เร็วผิดปกติ" หลัง login สำเร็จ — JWT ปกติอายุเป็นชั่วโมง หลุด
 *  ภายใน 10 วิหลัง login สำเร็จแทบเป็นไปไม่ได้จากการใช้งานจริง จึงเป็นสัญญาณว่า backend ปฏิเสธ JWT
 *  ต่อเนื่อง (verify พัง/key rotation/clock skew/ถูก revoke) ไม่ใช่หมดอายุตามอายุจริง (เคสนั้นต้อง
 *  ไม่โดนเพดาน — ถ้าห่างเกินค่านี้ตัวนับ reset กลับ 0 ด้านล่าง) ตัวเลขกว้างพอเผื่อความหน่วงของ
 *  network/CI ด้วย
 *
 *  Known limitation (ตั้งใจไม่แก้ — consultant follow-up): ถ้าแต่ละรอบของลูปกินเวลา **นานกว่า
 *  ค่านี้เอง** (เช่น data endpoint ที่ทำให้ต้อง re-login ตอบ 401 ช้ามาก ใกล้ axios timeout 15 วิ,
 *  §16.2) ตัวนับจะโดน reset ทุกรอบเพราะแต่ละรอบ "ห่าง" กันเกิน `LOOP_WINDOW_MS` เสมอ — ลูปจะเดินต่อ
 *  ไปเรื่อย ๆ แบบไม่ถูกตัด (ถูกจำกัดอัตราตามธรรมชาติจากความช้าของแต่ละรอบเอง ~สูงสุด 6 login/นาที
 *  ที่ 10 วิ/รอบ ไม่ใช่ยิงรัวไม่มีเพดานแบบที่ guard นี้ตั้งใจกัน) ยอมรับเคสนี้ได้เพราะเป้าหมายหลักคือ
 *  กันยิง POST /auth/login รัวไม่มีเพดานเมื่อแต่ละรอบเร็ว ซึ่งบรรลุแล้ว — ทางเลือก sliding window
 *  (นับจำนวนครั้งในหน้าต่างเวลาแทนนับติดกัน) ตัดทิ้งเพราะซับซ้อนขึ้นมากแลกกับเคสแคบ (ลูปช้าเกิน
 *  10 วิ/รอบต่อเนื่องจริง ๆ) */
const LOOP_WINDOW_MS = 10_000

export function useAuthBootstrap(idToken: string | null): AuthBootstrapStatus {
  const setSession = useAuthStore((state) => state.setSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const startedRef = useRef(false)
  const wasAuthenticatedRef = useRef(isAuthenticated)
  const reloginAttemptsRef = useRef(0)
  const lastReloginAtRef = useRef<number | null>(null)
  // ต้องเป็น useState ไม่ใช่ ref — ต้อง trigger re-render ให้ status ด้านล่างเปลี่ยนเป็น 'error'
  // จริง ไม่งั้นจอไม่ขยับ (ค้าง 'checking' ทั้งที่ effect หยุดยิง mutate ไปแล้ว)
  const [loopDetected, setLoopDetected] = useState(false)

  const mutation = useMutation<LoginResult, ApiError, string>({
    mutationFn: login,
    onSuccess: (result) => {
      if (result.status === 'authenticated') {
        lastReloginAtRef.current = Date.now()
        setSession(result.token, result.employee)
      }
    },
  })

  const { mutate } = mutation

  // F1 must-fix (consultant review) + 🔴 loop guard must-fix (audit เฟส auth): เซสชันหลุดกลางทาง
  // (เช่น `onUnauthorized` เรียก `clearSession()` ตอน backend endpoint อื่นตอบ UNAUTHORIZED,
  // §13.1/§16.2) ทำให้ `isAuthenticated` true→false — `startedRef` เดิมกันไม่ให้ effect ด้านล่างยิง
  // ซ้ำมาแต่ต้น (ถูกต้องสำหรับ mount รอบแรก) แต่ทำให้กรณีนี้ค้าง status 'checking' ตลอดไปเพราะไม่มี
  // อะไรมา reset ให้ยิง login ใหม่ — เช็ค transition true→false แล้ว reset `startedRef` เพื่อให้
  // effect ถัดไปยิง silent login รอบใหม่ทันที
  //
  // ⚠️ คอมเมนต์เดิม ณ จุดนี้เคยอ้างว่า "ไม่ loop" เพราะ re-login ล้มเหลวจริงจะโดน `isError` จับ —
  // **ไม่จริงสำหรับทุกเคส**: ถ้า backend ออก JWT ให้ login ผ่าน (200) ได้ทุกครั้ง แต่ verify JWT พัง
  // (key rotation/clock skew/พนักงานถูก revoke หลัง login) queries จะโดน UNAUTHORIZED ทันทีหลัง
  // ready ทุกรอบ → onUnauthorized → clearSession → transition true→false → reset startedRef →
  // login ใหม่ → ready → ... วนไม่รู้จบ (ยิง /auth/login รัวไม่มีเพดาน, จอกระพริบ checking/ready
  // สลับกัน) เคส "ล้มเหลวจริง" ที่ `isError` จับได้ คือ login เองตอบ error code เท่านั้น ไม่ครอบ
  // เคสนี้ที่ login ตอบ 200 ทุกครั้งแล้วค่อยหลุดทีหลังจาก endpoint อื่น
  //
  // แก้ด้วยการนับรอบ re-login ที่ "เร็วผิดปกติ" (ห่างจาก login สำเร็จครั้งก่อน < `LOOP_WINDOW_MS` —
  // ดูค่า/เหตุผลด้านบนไฟล์): เกิน `MAX_FAST_RELOGIN_ATTEMPTS` ครั้งติดกัน → **ไม่** reset
  // `startedRef` (effect ยิง mutate ด้านล่างจะไม่ทำงานอีก) และตั้ง `loopDetected` ให้ status คืน
  // 'error' — ผู้ใช้เจอจอ error + ปุ่ม "ลองใหม่" (reload) ของ `AuthGate.tsx` แทนการวนเงียบ ๆ
  // ถ้าห่างเกิน threshold (เคสปกติ เช่น token หมดอายุตามอายุจริงทุกชั่วโมง) ตัวนับ reset กลับ 0 ไม่
  // ให้สะสมข้ามช่วงเวลาไกลกันจนโดนเพดานผิดที่ผิดทาง
  //
  // 🔴 ห้ามใช้ liff.logout()+liff.login() เป็นทางออกของเคส UNAUTHORIZED ตรงนี้ — สงวนไว้ให้
  // ID_TOKEN_EXPIRED เท่านั้น (§13.3, ดู `registerAuthCallbacks.ts` ห้ามแตะ): ถ้า root cause คือ
  // backend ปฏิเสธ app JWT การ redirect ขอ LINE ID token ใหม่ไม่ช่วยอะไร (ID token ไม่ใช่ตัวที่มี
  // ปัญหา) และจะกลายเป็น redirect loop ทั้งหน้าซึ่งแย่กว่าเดิม
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      const now = Date.now()
      const isFastLoop =
        lastReloginAtRef.current !== null && now - lastReloginAtRef.current < LOOP_WINDOW_MS

      reloginAttemptsRef.current = isFastLoop ? reloginAttemptsRef.current + 1 : 0

      if (reloginAttemptsRef.current > MAX_FAST_RELOGIN_ATTEMPTS) {
        setLoopDetected(true)
      } else {
        startedRef.current = false
      }
    }
    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated || startedRef.current || !idToken) return
    startedRef.current = true
    mutate(idToken)
  }, [idToken, isAuthenticated, mutate])

  if (isAuthenticated) return 'ready'

  // ลูป re-login เร็วผิดปกติเกินเพดาน (ดูคอมเมนต์ยาวด้านบน) — คงที่ 'error' ถาวรจนกว่าผู้ใช้จะ
  // reload (ไม่มี auto-recovery ในตัวฮุคเอง กันวนซ้ำ)
  if (loopDetected) return 'error'

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
