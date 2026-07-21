/**
 * mocks/base.ts — BASE_URL กลางที่ handler ทุกไฟล์ใช้ร่วมกัน
 *
 * Vitest รัน mode `test` โดย default (ไม่โหลด `.env.development`) → `VITE_API_URL`
 * เป็น undefined ตอนเทสต์ — fallback `''` ทำให้ handler กลายเป็น relative path
 * (match request ที่ axios ยิงแบบ relative ต่อ jsdom location ได้พอดี)
 * ตอน dev บน browser จริง `VITE_API_URL` มีค่า (ngrok/local) → handler ยัง match
 * absolute URL เหมือนเดิม ไม่กระทบพฤติกรรมจริง
 */
export const BASE_URL = import.meta.env.VITE_API_URL ?? ''
