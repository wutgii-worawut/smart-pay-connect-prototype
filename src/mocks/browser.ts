/**
 * mocks/browser.ts — MSW worker สำหรับ localhost (§19.2)
 * เปิดเฉพาะเมื่อ `VITE_API_MOCK === 'true'` — ดู `src/main.tsx`
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
