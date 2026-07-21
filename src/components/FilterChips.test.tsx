import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterChips } from './FilterChips'

const OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'sick', label: 'ลาป่วย' },
  { value: 'vacation', label: 'ลาพักร้อน' },
]

describe('FilterChips', () => {
  it('single mode (ค่าเริ่มต้น): คลิก chip อื่น → onChange ได้ [value] แทนที่ค่าเดิม', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterChips options={OPTIONS} value={['all']} onChange={onChange} />)

    await user.click(screen.getByText('ลาป่วย'))

    expect(onChange).toHaveBeenCalledWith(['sick'])
  })

  it('multiple mode: คลิกเพิ่ม → array มีค่านั้นเพิ่มเข้าไป', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <FilterChips options={OPTIONS} value={['sick']} onChange={onChange} multiple />,
    )

    await user.click(screen.getByText('ลาพักร้อน'))

    expect(onChange).toHaveBeenCalledWith(['sick', 'vacation'])
  })

  it('multiple mode: คลิกซ้ำค่าที่เลือกอยู่ → ถูก remove ออกจาก array', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <FilterChips
        options={OPTIONS}
        value={['sick', 'vacation']}
        onChange={onChange}
        multiple
      />,
    )

    await user.click(screen.getByText('ลาป่วย'))

    expect(onChange).toHaveBeenCalledWith(['vacation'])
  })
})
