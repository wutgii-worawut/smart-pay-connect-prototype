/// <reference types="vite/client" />

/**
 * ประกาศ VITE_* env vars ที่แอปใช้จริง — ทับ fallback `Record<string, any>`
 * ของ vite/client.d.ts (ไม่งั้น `import.meta.env.VITE_XXX` ถูก infer เป็น `any`
 * ซึ่งขัดกฎ "ห้าม any" ของโปรเจกต์)
 */
interface ImportMetaEnv {
  readonly VITE_LIFF_ID: string
  readonly VITE_API_URL: string
  readonly VITE_LIFF_MOCK: string
  readonly VITE_API_MOCK: string
  /**
   * โหมดหน้าลงทะเบียน (feature-plans/01 §1.2, P9): 'form' | 'thaid' | 'both' — ค่าอื่น/ไม่ตั้ง
   * fallback เป็น 'both' (utils/registerConfig.ts เป็นคนตัดสิน ไม่ใช่ type นี้ตรง ๆ จึงเป็น
   * `string` ธรรมดา ไม่ใช่ literal union — ค่า env เป็น string เสมอ)
   */
  readonly VITE_REGISTER_MODE?: string
  /**
   * จำกัดโดเมนอีเมลตอนลงทะเบียน (เช่น "ap.go.th") — Open Question §23 domain องค์กรจริงยังไม่ยืนยัน
   * ไม่ตั้ง = ไม่จำกัด (รับทุกโดเมนที่เป็นอีเมล valid)
   */
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
