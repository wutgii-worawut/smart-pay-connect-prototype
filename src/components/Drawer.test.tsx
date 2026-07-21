import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from './Drawer'

function ControlledDrawer() {
  const [open, setOpen] = useState(true)
  return (
    <Drawer open={open} onOpenChange={setOpen} title="ยืนยันการลงเวลานอกสถานที่">
      <p>เนื้อหา Drawer</p>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('open=true → แสดงหัวข้อ + เนื้อหา + มี safe-area padding class', async () => {
    render(
      <Drawer open title="ยืนยันการลงเวลานอกสถานที่" onOpenChange={() => undefined}>
        <p>เนื้อหา Drawer</p>
      </Drawer>,
    )

    expect(await screen.findByText('ยืนยันการลงเวลานอกสถานที่')).toBeInTheDocument()
    expect(screen.getByText('เนื้อหา Drawer')).toBeInTheDocument()

    const content = document.querySelector('[data-vaul-drawer]')
    expect(content).not.toBeNull()
    expect(content).toHaveClass('pb-[calc(1.5rem+env(safe-area-inset-bottom))]')
  })

  it('open=false → ไม่ render หัวข้อ', () => {
    render(
      <Drawer open={false} title="ยืนยันการลงเวลานอกสถานที่" onOpenChange={() => undefined}>
        <p>เนื้อหา Drawer</p>
      </Drawer>,
    )

    expect(screen.queryByText('ยืนยันการลงเวลานอกสถานที่')).not.toBeInTheDocument()
  })

  it('มีปุ่มปิดชัดเจน (aria-label ปิด) และกดแล้ว state ปิด', async () => {
    const user = userEvent.setup()
    render(<ControlledDrawer />)

    const closeButton = await screen.findByRole('button', { name: 'ปิด' })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('เนื้อหา Drawer')).not.toBeInTheDocument()
    })
  })
})
