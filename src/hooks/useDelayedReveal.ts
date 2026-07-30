/**
 * hooks/useDelayedReveal.ts — หน่วงการโชว์การ์ด bootstrap ให้พ้น flash (§20.2, P23)
 *
 * bootstrap จริง (LiffGate init → AuthGate login) มักเสร็จเร็วกว่า `delayMs` — ถ้าโชว์การ์ดทันที
 * จะกระพริบขึ้นแล้วหายเกือบพร้อมกัน ก่อนครบเวลาให้ caller คงพื้นเปล่าไว้ (ไม่มี spinner/การ์ด)
 *
 * bootstrap มี 2 gate mount แยกกันตามลำดับ (LiffGate unmount → router mount → AuthGate mount) —
 * ถ้าแต่ละ mount นับเวลาใหม่จะเห็นการ์ด → จอเปล่า → การ์ด (กระพริบซ้ำ) จึงใช้ latch ระดับโมดูล:
 * เมื่อ reveal ครั้งแรกในหน้านี้แล้ว mount ถัดไปทั้งหมดคืน true ทันทีโดยไม่รอ delay ซ้ำ
 */
import { useEffect, useState } from 'react'

let hasRevealed = false

export function useDelayedReveal(delayMs = 300): boolean {
  const [revealed, setRevealed] = useState(hasRevealed)

  useEffect(() => {
    if (hasRevealed) {
      return
    }
    const timer = setTimeout(() => {
      hasRevealed = true
      setRevealed(true)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  return revealed
}

/**
 * สำหรับเทสต์เท่านั้น — เคลียร์ latch ระดับโมดูลระหว่างเคส (latch จงใจค้างข้าม mount จริงในแอป
 * เพื่อกันจอกระพริบซ้ำระหว่าง LiffGate → AuthGate แต่ทำให้เทสต์ leak ข้ามเคสถ้าไม่ reset)
 */
export function __resetDelayedRevealForTests(): void {
  hasRevealed = false
}
