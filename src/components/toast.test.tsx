import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppToaster } from './Toaster'
import { toastError, toastSuccess } from './toast'

describe('toastSuccess / toastError', () => {
  it('แสดงข้อความ toast สำเร็จหลังเรียก toastSuccess', async () => {
    render(<AppToaster />)

    toastSuccess('ยกเลิกคำขอแล้ว')

    expect(await screen.findByText('ยกเลิกคำขอแล้ว')).toBeInTheDocument()
  })

  it('แสดงข้อความ toast ผิดพลาดหลังเรียก toastError', async () => {
    render(<AppToaster />)

    toastError('เกิดข้อผิดพลาด กรุณาลองใหม่')

    expect(await screen.findByText('เกิดข้อผิดพลาด กรุณาลองใหม่')).toBeInTheDocument()
  })
})
