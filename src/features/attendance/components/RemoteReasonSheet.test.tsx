import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RemoteReasonSheet } from './RemoteReasonSheet'

function ControlledSheet({ onSubmitReason }: { onSubmitReason: (reason: string) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <RemoteReasonSheet
      open={open}
      onOpenChange={setOpen}
      onSubmitReason={onSubmitReason}
      isPending={false}
    />
  )
}

describe('RemoteReasonSheet', () => {
  it('ส่งฟอร์มว่าง → ขึ้น error ใต้ช่อง ไม่เรียก onSubmitReason', async () => {
    const onSubmitReason = vi.fn()
    render(<ControlledSheet onSubmitReason={onSubmitReason} />)

    await userEvent.click(screen.getByRole('button', { name: 'ยืนยันลงเวลา' }))

    expect(await screen.findByText('กรุณาระบุเหตุผลที่ไปทำงานนอกสถานที่')).toBeInTheDocument()
    expect(onSubmitReason).not.toHaveBeenCalled()
  })

  it('กรอกเหตุผลแล้วกดยืนยัน → เรียก onSubmitReason ด้วยข้อความที่กรอก', async () => {
    const onSubmitReason = vi.fn()
    render(<ControlledSheet onSubmitReason={onSubmitReason} />)

    await userEvent.type(screen.getByLabelText('เหตุผล'), 'ออกพบลูกค้า')
    await userEvent.click(screen.getByRole('button', { name: 'ยืนยันลงเวลา' }))

    expect(onSubmitReason).toHaveBeenCalledWith('ออกพบลูกค้า')
  })

  it('isPending=true → ปุ่มยืนยัน disabled กันกดซ้ำ', () => {
    render(
      <RemoteReasonSheet
        open
        onOpenChange={vi.fn()}
        onSubmitReason={vi.fn()}
        isPending={true}
      />,
    )

    expect(screen.getByRole('button', { name: /กำลังลงเวลา/ })).toBeDisabled()
  })
})
