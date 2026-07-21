import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import '@/styles/globals.css'

/**
 * เปิด MSW เฉพาะ dev/local เมื่อ `VITE_API_MOCK=true` (§19.2) — dynamic import
 * ทำให้ Vite แยก mocks ออกเป็น chunk ต่างหาก ไม่ต้องโหลด/รัน worker ตอนปิด flag
 */
async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_API_MOCK !== 'true') return
  const { worker } = await import('@/mocks/browser')
  // dev-only: อย่าให้ worker.start() ล้มเหลว (เช่น mockServiceWorker.js หาย) ทำให้จอขาวเงียบ
  await worker.start({ onUnhandledRequest: 'bypass' }).catch((error: unknown) => {
    console.error('[MSW] worker เริ่มไม่สำเร็จ — จะรันแอปต่อโดยไม่มี mock API', error)
  })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
