import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// `globals: false` ใน vitest.config.ts → @testing-library/react ไม่ auto-cleanup ให้เอง
// (ปกติมันเช็ค global afterEach ที่เราปิดไว้) — unmount DOM ทุกเทสต์ที่ใช้ render() กันชนกัน
afterEach(() => {
  cleanup()
})

// jsdom ยังไม่ implement Pointer Capture API — vaul (Drawer, P6) เรียก
// setPointerCapture/releasePointerCapture/hasPointerCapture ตอน drag gesture ทำให้เทสต์ที่คลิก
// ภายใน Drawer.Content (แม้แค่ปุ่มปิด) โยน "is not a function" — polyfill เป็น no-op เฉพาะใน jsdom
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false
  window.HTMLElement.prototype.setPointerCapture = () => undefined
  window.HTMLElement.prototype.releasePointerCapture = () => undefined
}

// jsdom ยังไม่ implement scrollIntoView — @radix-ui/react-select (Select, P4/P16) เรียกตอนเปิด
// dropdown เพื่อเลื่อนไปหา item ที่เลือกอยู่ ไม่มี polyfill ทำให้ effect throw แล้ว React unmount ทั้งจอ
// เงียบ ๆ (เทสต์เห็น body ว่างเปล่าโดยไม่มี error message ตรง ๆ) — polyfill เป็น no-op เฉพาะใน jsdom
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => undefined
}
