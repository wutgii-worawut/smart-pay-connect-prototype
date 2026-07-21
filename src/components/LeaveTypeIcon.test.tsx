import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaveTypeIcon } from './LeaveTypeIcon'

describe('LeaveTypeIcon', () => {
  it('type="vacation" แสดงรูป alt "ลาพักร้อน" และ src ตรงไฟล์ leave-vacation', () => {
    render(<LeaveTypeIcon type="vacation" />)

    const img = screen.getByRole('img', { name: 'ลาพักร้อน' })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('leave-vacation')
  })

  it('type="sick" แสดงรูป alt "ลาป่วย" และ src ตรงไฟล์ leave-sick', () => {
    render(<LeaveTypeIcon type="sick" />)

    const img = screen.getByRole('img', { name: 'ลาป่วย' })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('leave-sick')
  })

  it('type="personal" แสดงรูป alt "ลากิจ" และ src ตรงไฟล์ leave-personal', () => {
    render(<LeaveTypeIcon type="personal" />)

    const img = screen.getByRole('img', { name: 'ลากิจ' })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('leave-personal')
  })
})
