/**
 * app/providers.tsx — ประกอบ provider ตามลำดับ (§11-12, §20.1)
 * LiffProvider → LiffGate (3 สถานะ) → ErrorBoundary (ตาข่ายสุดท้าย) → QueryClientProvider →
 * RouterProvider — ห้าม render router ก่อน LiffGate ปล่อยผ่าน (§12.1)
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { LiffProvider } from '@/lib/liff/LiffProvider'
import { LiffGate } from '@/lib/liff/LiffGate'
import { ErrorBoundary } from './ErrorBoundary'
import { router } from './router'

export function Providers() {
  return (
    <LiffProvider>
      <LiffGate>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ErrorBoundary>
      </LiffGate>
    </LiffProvider>
  )
}
