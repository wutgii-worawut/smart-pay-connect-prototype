/**
 * lib/query-client.ts — TanStack Query client เดียวของทั้งแอป (§20.4)
 *
 * - query: retry สูงสุด 2 ครั้ง แต่ไม่ retry เมื่อเจอ 4xx (ยิงซ้ำได้คำตอบเดิม)
 * - mutation: `retry: 0` เสมอ (กฎเหล็ก — กันลงเวลา/ยื่นลาซ้ำตอนเน็ตกำกวม)
 */
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) {
          return false // 4xx ไม่ retry
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
