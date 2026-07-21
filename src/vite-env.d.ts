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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
