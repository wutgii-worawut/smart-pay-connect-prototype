/**
 * features/auth/hooks/useResendCountdown.ts — countdown ก่อนกด "ส่งรหัสอีกครั้ง" ได้ (feature-plans/01
 * §1.3) แตะ React (setInterval + state) จึงเป็น hook ไม่ใช่ pure util (code-style.md §7)
 *
 * [ตัดสินใจนอก spec] design/feature-plan ไม่ได้ระบุจำนวนวินาที ("countdown ก่อนกดส่งซ้ำได้") —
 * เลือกใช้ 60 วินาที (มาตรฐานทั่วไปของ OTP resend) เป็นค่าเริ่มต้น ปรับได้ผ่าน param
 * `RESEND_COUNTDOWN_SECONDS` = contract flag รอผู้ใช้/นโยบายเคาะจริง (เก็บคู่กับ policy OTP
 * อายุ 15 นาที + rate limit ที่ยังไม่เคาะใน feature-plans/01 ท้ายไฟล์)
 */
import { useEffect, useState } from 'react'

export const RESEND_COUNTDOWN_SECONDS = 60

interface UseResendCountdownResult {
  /** วินาทีที่เหลือก่อนกดส่งซ้ำได้ */
  remaining: number
  /** true เมื่อ remaining <= 0 (กดส่งซ้ำได้แล้ว) */
  isReady: boolean
  /** เริ่มนับถอยหลังใหม่ (เรียกหลังกดส่งซ้ำสำเร็จ) */
  reset: (seconds?: number) => void
  /** บังคับให้กดส่งซ้ำได้ทันที (เช่น OTP_EXPIRED — เสนอส่งใหม่ทันทีโดยไม่ต้องรอ) */
  forceReady: () => void
}

export function useResendCountdown(
  initialSeconds: number = RESEND_COUNTDOWN_SECONDS,
): UseResendCountdownResult {
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return {
    remaining,
    isReady: remaining <= 0,
    reset: (seconds = initialSeconds) => setRemaining(seconds),
    forceReady: () => setRemaining(0),
  }
}
