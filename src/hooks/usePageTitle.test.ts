import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePageTitle } from './usePageTitle'

describe('usePageTitle', () => {
  it('ตั้ง document.title เป็น "SmartPay Connect : <title>"', () => {
    renderHook(() => usePageTitle('ลงเวลาทำงาน'))

    expect(document.title).toBe('SmartPay Connect : ลงเวลาทำงาน')
  })

  it('เปลี่ยน document.title เมื่อ title เปลี่ยน', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'บันทึกการลา' },
    })
    expect(document.title).toBe('SmartPay Connect : บันทึกการลา')

    rerender({ title: 'ดูสลิปเงินเดือน' })
    expect(document.title).toBe('SmartPay Connect : ดูสลิปเงินเดือน')
  })
})
