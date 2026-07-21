/**
 * features/auth/utils/registerConfig.ts — pure config helpers สำหรับจอ register (P9)
 *
 * ⚠️ Open Questions §23 (architecture.md) — ยังไม่เคาะ:
 * - ThaID OAuth phase: `getRegisterMode()` ควบคุมว่าโชว์ปุ่ม ThaID ไหม/ตัดฟอร์มออกหรือไม่
 *   (config เท่านั้น — **ห้ามต่อ flow OAuth จริง**)
 * - โดเมนอีเมลองค์กรจริง: `getAllowedEmailDomain()` — ไม่ตั้ง env = ไม่จำกัดโดเมน
 *
 * อ่าน `import.meta.env` ภายใน function body เสมอ (ไม่ cache เป็นค่าคงที่ระดับโมดูล) เพื่อให้
 * เทสต์สลับค่าได้ด้วย `vi.stubEnv()` โดยไม่ต้องแยกไฟล์เทสต์ต่อ scenario (ต่างจากกับดัก
 * LiffProvider memoized promise ที่บันทึกไว้ใน progress.md P3 ข้อ 6)
 */
export type RegisterMode = 'form' | 'thaid' | 'both'

function isRegisterMode(value: string | undefined): value is RegisterMode {
  return value === 'form' || value === 'thaid' || value === 'both'
}

/** ค่าไม่ตั้ง/ไม่รู้จัก → fallback 'both' (จอ 1.1 เต็ม — ฟอร์ม + ปุ่ม ThaID) */
export function getRegisterMode(): RegisterMode {
  const raw = import.meta.env.VITE_REGISTER_MODE
  return isRegisterMode(raw) ? raw : 'both'
}

/** ค่าไม่ตั้ง/ว่าง → undefined (ไม่จำกัดโดเมน) — ค่าที่คืนเป็น lowercase ไม่มี '@' นำหน้า */
export function getAllowedEmailDomain(): string | undefined {
  const raw = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN
  const trimmed = raw?.trim()
  return trimmed && trimmed.length > 0 ? trimmed.toLowerCase() : undefined
}
