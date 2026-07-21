import { describe, expect, it } from 'vitest'
import { ApiError } from './api-client'
import { queryClient } from './query-client'

describe('query-client defaults', () => {
  it('mutation ทุกตัว retry: 0 เสมอ (กันลงเวลา/ยื่นลาซ้ำ)', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0)
  })

  it('query ไม่ retry เมื่อเจอ ApiError 4xx', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')
    if (typeof retry !== 'function') return

    expect(retry(0, new ApiError('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', 400))).toBe(false)
    expect(retry(0, new ApiError('FORBIDDEN', 'ไม่มีสิทธิ์', 403))).toBe(false)
  })

  it('query retry สูงสุด 2 ครั้งสำหรับ error อื่นที่ไม่ใช่ 4xx (เช่น NETWORK_ERROR/5xx)', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')
    if (typeof retry !== 'function') return

    const networkError = new ApiError('NETWORK_ERROR', 'เชื่อมต่อไม่ได้', 0)
    expect(retry(0, networkError)).toBe(true)
    expect(retry(1, networkError)).toBe(true)
    expect(retry(2, networkError)).toBe(false)

    const serverError = new ApiError('UNKNOWN', 'เกิดข้อผิดพลาด', 500)
    expect(retry(0, serverError)).toBe(true)
    expect(retry(2, serverError)).toBe(false)
  })
})
