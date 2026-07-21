/**
 * lib/liff/liff-context.ts — React context ที่เก็บสถานะ LIFF init (§11-12, §20.2)
 *
 * แยกออกจาก LiffProvider.tsx (component) เป็นไฟล์ .ts เปล่า เพื่อไม่ให้ชน
 * eslint react-refresh/only-export-components (ไฟล์ component ห้าม export ของที่ไม่ใช่ component)
 */
import { createContext } from 'react'
import liff from '@line/liff'

/**
 * 3 สถานะตาม §20.2 — ห้ามมีแค่ loading/ready เฉย ๆ ต้องแยก error ออกมาชัดเจน
 * เพื่อไม่ให้ LiffGate หมุนค้างตลอดกาลเมื่อ liff.init() ล้มเหลว
 */
export type LiffState =
  | { status: 'loading' }
  | { status: 'ready'; liff: typeof liff }
  | { status: 'error'; error: Error }

export const LiffContext = createContext<LiffState>({ status: 'loading' })
