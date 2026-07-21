/**
 * lib/liff/LiffProvider.tsx — init LIFF ครั้งเดียวตอนแอปเปิด (§11-12)
 *
 * - `liff.init({ liffId })` — ID มาจาก `import.meta.env.VITE_LIFF_ID` เท่านั้น (ห้าม hardcode)
 * - เมื่อ `VITE_LIFF_MOCK === 'true'` ติดตั้ง `@line/liff-mock` ก่อน init เสมอ (§19.2) —
 *   dynamic import ทำให้ build จริง (mock flag ไม่ตั้ง) ตัด branch นี้ทิ้งได้ทั้งหมด
 * - ห้าม render ต่อก่อน init resolve (§12.1) — component นี้แค่ประกาศสถานะผ่าน context,
 *   ตัวที่ห้าม render จริง ๆ คือ `LiffGate`
 */
import liff from '@line/liff'
import { useEffect, useState, type ReactNode } from 'react'
import type { LiffMockApi } from '@line/liff-mock'
import { LiffContext, type LiffState } from './liff-context'

/**
 * `@line/liff-mock` เพิ่ม field `mock` ให้ config ตอนรันจริง แต่ไม่ได้ augment type ของ
 * `@line/liff` ให้ (ดู README ของ liff-mock) — ประกาศ interface ของเราเองแล้วส่งผ่านตัวแปร
 * แทนการส่ง object literal ตรง ๆ (excess-property check จะ error) และแทนการ `as` cast
 * (กฎ code-style: ห้าม type assertion เพื่อปิด error) วิธีนี้ TS ยังตรวจ structural ครบ
 */
interface LiffInitConfig {
  liffId: string
  mock?: boolean
}

/**
 * เหตุผลเดียวกับข้างบน: `liff.use(new LiffMockPlugin())` แปะ `$mock` ลงบน instance `liff`
 * ตอน runtime จริง แต่ type ของ `liff.use()` คืนค่าเป็น `Liff` เดิมเสมอ (ไม่รู้จัก plugin API
 * ที่เพิ่มมา) — ใช้ type predicate เช็คจาก runtime (`'$mock' in value`) แทนการ `as` cast
 */
function isLiffWithMock(value: typeof liff): value is typeof liff & { $mock: LiffMockApi } {
  return '$mock' in value
}

type LiffInitResult = { status: 'ready'; liff: typeof liff } | { status: 'error'; error: Error }

/**
 * Promise ระดับ module — กัน `liff.use()`/`liff.init()` ถูกเรียกซ้ำตอน React StrictMode
 * double-invoke effect ใน dev (เรียกจริงแค่ครั้งเดียวเพราะ promise ถูก cache ไว้) ทุก effect
 * ที่เรียกเข้ามา (รอบแรกที่ถูก cleanup ทิ้ง + รอบที่สองที่ค้างอยู่จริง) ได้ผลลัพธ์เดียวกัน
 */
let liffInitPromise: Promise<LiffInitResult | undefined> | null = null

function runLiffInit(): Promise<LiffInitResult | undefined> {
  liffInitPromise ??= (async (): Promise<LiffInitResult | undefined> => {
    try {
      const isMock = import.meta.env.VITE_LIFF_MOCK === 'true'

      if (isMock) {
        const { LiffMockPlugin } = await import('@line/liff-mock')
        liff.use(new LiffMockPlugin())
        if (isLiffWithMock(liff)) {
          // liff-mock ค่า default `isLoggedIn` เป็น false เสมอและ `login()` mock ไม่ flip ค่าให้
          // (ต้องเรียก `liff.$mock.set(...)` เอง) — set ไว้ก่อนเพื่อให้เดิน code path เดียวกับ
          // โหมดจริงได้ (isLoggedIn() true ทันที ไม่ต้องแยกเงื่อนไข mock/real ด้านล่าง)
          liff.$mock.set((prev) => ({ ...prev, isLoggedIn: true }))
        }
      }

      const initConfig: LiffInitConfig = {
        liffId: import.meta.env.VITE_LIFF_ID,
        mock: isMock,
      }
      await liff.init(initConfig)

      // code path เดียวกันทั้งสองโหมด (§12.2) — mock ผ่านเพราะ set ค่า isLoggedIn ไว้แล้วข้างบน
      if (!liff.isLoggedIn()) {
        liff.login() // external browser → redirect ทั้งหน้า ไม่ต้อง resolve สถานะต่อ
        return undefined
      }

      return { status: 'ready', liff }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error : new Error('เริ่มต้น LIFF ไม่สำเร็จ'),
      }
    }
  })()

  return liffInitPromise
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    runLiffInit().then((result) => {
      if (!cancelled && result) setState(result)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return <LiffContext value={state}>{children}</LiffContext>
}
