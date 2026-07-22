import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ManagerBanner } from './ManagerBanner'

describe('ManagerBanner', () => {
  it('แสดงคำว่า "หัวหน้า" + ชื่อ (มีคำนำหน้า "คุณ") + initials ของ avatar', () => {
    render(<ManagerBanner name="วิชัย มั่นคง" />)

    expect(screen.getByText('หัวหน้า')).toBeInTheDocument()
    expect(screen.getByText('คุณวิชัย มั่นคง')).toBeInTheDocument()
    expect(screen.getByText('วม')).toBeInTheDocument()
  })
})
