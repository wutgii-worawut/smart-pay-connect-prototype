import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// `globals: false` ใน vitest.config.ts → @testing-library/react ไม่ auto-cleanup ให้เอง
// (ปกติมันเช็ค global afterEach ที่เราปิดไว้) — unmount DOM ทุกเทสต์ที่ใช้ render() กันชนกัน
afterEach(() => {
  cleanup()
})
