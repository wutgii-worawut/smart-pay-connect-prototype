/**
 * features/auth/registerAuthCallbacks.ts — เสียบ callback กลางของ lib/api-client (§13.3, §16.2)
 *
 * `lib/api-client.ts` ห้าม import จาก features (กฎเหล็ก §6) จึงเตรียม setter ไว้ (`setOnIdTokenExpired`,
 * `setOnUnauthorized`) ให้ auth feature call กลับเข้าไปแทน — เรียกครั้งเดียวตอน import
 * `features/auth` (module side-effect, ดู index.ts) ต้องเกิดก่อน API call แรกของแอปเสมอ
 */
import liff from '@line/liff'
import { setOnIdTokenExpired, setOnUnauthorized } from '@/lib/api-client'
import { useAuthStore } from './stores/authStore'

let registered = false

export function registerAuthCallbacks(): void {
  if (registered) return
  registered = true

  // §13.3: LINE ID token หมดอายุ — liff.logout() ฉีกตั๋วที่แคชไว้เท่านั้น (ไม่กระทบ LINE login
  // ของผู้ใช้) แล้ว liff.login() ขอตั๋วใหม่ผ่าน redirect ทั้งหน้า → liff.init() รอบใหม่ได้ token สด
  setOnIdTokenExpired(() => {
    liff.logout()
    liff.login()
  })

  // §16.2/§13.1: UNAUTHORIZED/MISSING_TOKEN/INVALID_TOKEN — ล้าง session ฝั่งเรา
  // `clearSession()` พลิก `isAuthenticated` เป็น false ทันที ซึ่ง `useAuthBootstrap` (ทุก
  // instance ที่ mount อยู่ใน AuthGate ตอนนั้น) ดักการเปลี่ยนนี้แล้วยิง silent login ใหม่
  // อัตโนมัติทันทีในตัวมันเอง (ดู comment "F1" ใน useAuthBootstrap.ts) — ไม่ต้องรอผู้ใช้ navigate
  setOnUnauthorized(() => {
    useAuthStore.getState().clearSession()
  })
}
