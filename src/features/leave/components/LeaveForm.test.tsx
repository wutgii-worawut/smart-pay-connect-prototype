import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppToaster } from '@/components/Toaster'
import { ApiError } from '@/lib/api-client'
import type { LeaveBalance, LeaveCreatePayload, Teammate } from '@/types/leave'
import { LeaveForm } from './LeaveForm'

const BALANCES: LeaveBalance[] = [
  { type: 'vacation', total: 20, carriedOver: 5, used: 5, pending: 3, remaining: 19 },
  { type: 'sick', total: 30, carriedOver: 0, used: 2, pending: 0, remaining: 28 },
  { type: 'personal', total: 10, carriedOver: 0, used: 1, pending: 0, remaining: 9 },
]

const TEAMMATES: Teammate[] = [
  { id: 'teammate-1', name: 'นายแทนคุณ สมมุติ' },
  { id: 'teammate-2', name: 'นางสาวสมหญิง ใจดี' },
]

interface RenderOptions {
  onSubmit?: ReturnType<typeof vi.fn<(payload: LeaveCreatePayload) => void>>
  isPending?: boolean
  submitError?: ApiError | null
}

function renderForm({ onSubmit = vi.fn(), isPending = false, submitError = null }: RenderOptions = {}) {
  render(
    <>
      <AppToaster />
      <LeaveForm
        balances={BALANCES}
        holidays={[]}
        teammates={TEAMMATES}
        approverName="นายวิชัย มั่นคง"
        isPending={isPending}
        submitError={submitError}
        onSubmit={onSubmit}
      />
    </>,
  )
  return onSubmit
}

async function pickSingleDay(user: ReturnType<typeof userEvent.setup>, dayLabel: RegExp) {
  await user.click(screen.getAllByText('เลือกวันที่')[0])
  await user.click(await screen.findByRole('button', { name: dayLabel }))
  await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))
}

async function pickProxy(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('combobox', { name: 'ผู้ปฏิบัติงานแทน (ถ้ามี)' }))
  await user.click(await screen.findByRole('option', { name }))
}

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 5, 10))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LeaveForm', () => {
  it('render หัวข้อ 4 หมวดตาม design + ปุ่มส่งคำขอลา', () => {
    renderForm()

    expect(screen.getByText('ขออนุมัติลา')).toBeInTheDocument()
    expect(screen.getByText('ประเภทการลา')).toBeInTheDocument()
    expect(screen.getByText('ช่วงวันที่ลา')).toBeInTheDocument()
    expect(screen.getByText('เหตุผลการลา')).toBeInTheDocument()
    expect(screen.getByText('แนบเอกสาร (ถ้ามี)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ส่งคำขอลา/ })).toBeInTheDocument()
  })

  it('การ์ดประเภทลาโชว์ "คงเหลือ (โดยประมาณ)" ตรงกับ balance ที่ส่งมา (§7.4)', () => {
    renderForm()

    expect(screen.getByText(/Annual leave · คงเหลือ \(โดยประมาณ\) 19 วัน/)).toBeInTheDocument()
    expect(screen.getByText(/Sick leave · คงเหลือ \(โดยประมาณ\) 28 วัน/)).toBeInTheDocument()
  })

  it('ส่งฟอร์มว่างทั้งหมด → โชว์ error ทุกช่องบังคับ (ไม่รวมผู้ปฏิบัติงานแทนที่ optional) ไม่เรียก onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(await screen.findByText('กรุณาเลือกประเภทการลา')).toBeInTheDocument()
    expect(screen.getByText('กรุณาเลือกช่วงวันที่ลา')).toBeInTheDocument()
    expect(screen.getByText('กรุณาระบุเหตุผลการลา')).toBeInTheDocument()
    // ผู้ปฏิบัติงานแทน optional (substituteId? ตาม §16.3, ผู้ใช้เคาะ 2026-07-22) — ไม่มี error ช่องนี้
    expect(screen.queryByText('กรุณาเลือกผู้ปฏิบัติงานแทน')).not.toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('ส่งฟอร์มว่าง → auto-scroll + focus ไป section ประเภทการลา (field แรกที่ error ตามลำดับบนจอ)', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    // กัน call history ค้างจากเทสต์ก่อนหน้าที่ spy method เดียวกัน (ไม่มี restoreMocks/clearMocks ใน
    // vitest.config.ts ทั้ง repo) — ไม่ clear แล้ว assertion ด้านล่างจะ pass เสมอแม้ลบ scroll ออกจริง
    scrollSpy.mockClear()
    renderForm()

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))
    await screen.findByText('กรุณาเลือกประเภทการลา')

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    const typeSection = screen.getByText('ประเภทการลา').closest('section')
    expect(typeSection).not.toBeNull()
    expect(document.activeElement).toBe(typeSection)
  })

  it('ส่งฟอร์มที่เลือกประเภทแล้วแต่ยังไม่เลือกช่วงวันที่ → auto-scroll ไป wrapper ที่มีข้อความ error ช่วงวันที่ (ไม่ใช่ section ทั้งก้อน) + focus section เดิม', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    scrollSpy.mockClear()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    const errorText = await screen.findByText('กรุณาเลือกช่วงวันที่ลา')
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    const [scrolledElement] = scrollSpy.mock.contexts
    if (!(scrolledElement instanceof HTMLElement)) throw new Error('scrollIntoView ไม่ถูกเรียก')
    expect(scrolledElement.contains(errorText)).toBe(true)

    const dateRangeSection = screen.getByText('ช่วงวันที่ลา').closest('section')
    expect(scrolledElement).not.toBe(dateRangeSection)
    expect(document.activeElement).toBe(dateRangeSection)
  })

  it('ส่งฟอร์มที่กรอกครบยกเว้นเหตุผล → focus ไป textarea เหตุผล (guard shouldFocusError: false ไม่ถูกลบ)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await pickSingleDay(user, /16 มิถุนายน/)

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))
    await screen.findByText('กรุณาระบุเหตุผลการลา')

    const reasonField = screen.getByPlaceholderText(/ระบุเหตุผล/)
    expect(document.activeElement).toBe(reasonField)
  })

  it('กดการ์ดประเภทลา → เลือกได้ทีละใบ (radio) เปลี่ยนใบที่ selected ตามที่กด', async () => {
    const user = userEvent.setup()
    renderForm()

    const vacationCard = screen.getByRole('radio', { name: /ลาพักร้อน/ })
    const sickCard = screen.getByRole('radio', { name: /ลาป่วย/ })

    await user.click(vacationCard)
    expect(vacationCard).toHaveAttribute('aria-checked', 'true')
    expect(sickCard).toHaveAttribute('aria-checked', 'false')

    await user.click(sickCard)
    expect(vacationCard).toHaveAttribute('aria-checked', 'false')
    expect(sickCard).toHaveAttribute('aria-checked', 'true')
  })

  it('ช่องผู้อนุมัติ read-only/disabled โชว์ค่าจาก prop approverName เสมอ', () => {
    renderForm()

    const approverField = screen.getByRole('combobox', { name: 'ผู้อนุมัติ' })
    expect(approverField).toHaveTextContent('นายวิชัย มั่นคง')
    expect(approverField).toBeDisabled()
  })

  it('flow วันเดียว: เลือกประเภท+วันที่เดียว+เหตุผล+ผู้ปฏิบัติงานแทน → onSubmit ได้ payload days ยาว 1 (YYYY-MM-DD string)', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await pickSingleDay(user, /16 มิถุนายน/)
    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'เดินทางต่างจังหวัดกับครอบครัว')
    await pickProxy(user, 'นายแทนคุณ สมมุติ')

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(onSubmit).toHaveBeenCalledWith({
      leaveType: 'vacation',
      days: [{ date: '2026-06-16', period: 'full' }],
      reason: 'เดินทางต่างจังหวัดกับครอบครัว',
      substituteId: 'teammate-1',
      attachments: [],
    })
  })

  it('flow วันเดียว ไม่เลือกผู้ปฏิบัติงานแทน → onSubmit ได้ payload ที่ไม่มี key substituteId เลย (optional §16.3)', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await pickSingleDay(user, /16 มิถุนายน/)
    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'เดินทางต่างจังหวัดกับครอบครัว')

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(onSubmit).toHaveBeenCalledWith({
      leaveType: 'vacation',
      days: [{ date: '2026-06-16', period: 'full' }],
      reason: 'เดินทางต่างจังหวัดกับครอบครัว',
      attachments: [],
    })
    const payload = onSubmit.mock.calls[0][0]
    expect('substituteId' in payload).toBe(false)
  })

  it('เลือกผู้ปฏิบัติงานแทนแล้วเปลี่ยนใจกด "ไม่ระบุ" → payload กลับไปไม่มี key substituteId', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))
    await pickSingleDay(user, /16 มิถุนายน/)
    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'เดินทางต่างจังหวัดกับครอบครัว')
    await pickProxy(user, 'นายแทนคุณ สมมุติ')
    await pickProxy(user, 'ไม่ระบุ')

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    const payload = onSubmit.mock.calls[0][0]
    expect('substituteId' in payload).toBe(false)
  })

  it('flow หลายวันคร่อมเสาร์-อาทิตย์: สลับ toggle วันหนึ่งเป็นครึ่งเช้า → payload ตัดวันหยุดออก คงแค่วันทำงาน', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('radio', { name: /ลาพักร้อน/ }))

    // 2026-06-18 (พฤหัส) ถึง 2026-06-21 (อาทิตย์) → วันทำงานจริงแค่ 18-19
    await user.click(screen.getAllByText('เลือกวันที่')[0])
    await user.click(await screen.findByRole('button', { name: /18 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: /21 มิถุนายน/ }))
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))

    const row19 = screen.getByRole('radiogroup', { name: /19 มิ.ย. 2569/ })
    await user.click(within(row19).getByRole('radio', { name: 'เช้า' }))

    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'ธุระส่วนตัว')
    await pickProxy(user, 'นายแทนคุณ สมมุติ')

    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(onSubmit).toHaveBeenCalledWith({
      leaveType: 'vacation',
      days: [
        { date: '2026-06-18', period: 'full' },
        { date: '2026-06-19', period: 'am' },
      ],
      reason: 'ธุระส่วนตัว',
      substituteId: 'teammate-1',
      attachments: [],
    })
  })

  // [ผู้ใช้เคาะ 2026-07-31] คำเตือน preview เกินโควตา — deviation จาก design PNG 6.1/6.2 (ยังต้อง
  // ส่งฟอร์มได้ปกติ ไม่บล็อก — โควตาจริงเป็นหน้าที่ backend §7.5)
  it('เลือกลากิจ (คงเหลือ 9 วัน) + ช่วงวันที่ทำงานรวม 10 วัน → โชว์คำเตือนเกินคงเหลือ แต่ยังส่งฟอร์มได้ปกติ', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('radio', { name: /ลากิจ/ }))

    // 2026-06-01 (จ.) ถึง 2026-06-12 (ศ.) → วันทำงาน 10 วัน (ตัดเสาร์-อาทิตย์ 6-7) เกินคงเหลือ 9 วัน
    // aria-label เต็มรูปแบบ "วันจันทร์ที่ 1 มิถุนายน 2026" — ใช้ negative lookbehind กันชนกับวันที่
    // ลงท้ายด้วยเลขเดียวกัน (11, 21 มิถุนายน ก็มี "1 มิถุนายน" เป็น substring)
    await user.click(screen.getAllByText('เลือกวันที่')[0])
    await user.click(await screen.findByRole('button', { name: /(?<!\d)1 มิถุนายน 2026/ }))
    await user.click(screen.getByRole('button', { name: /(?<!\d)12 มิถุนายน 2026/ }))
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }))

    expect(await screen.findByText('เกินวันลาคงเหลือ (โดยประมาณ) 1 วัน')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/ระบุเหตุผล/), 'ธุระส่วนตัว')
    await user.click(screen.getByRole('button', { name: /ส่งคำขอลา/ }))

    expect(onSubmit).toHaveBeenCalled()
  })

  it('QUOTA_EXCEEDED (submitError prop) → โชว์ error ตรงช่องวันที่ ไม่ใช่ toast + scroll ไปหา + role=alert', () => {
    const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    // กัน call history ค้างจากเทสต์ก่อนหน้า (ดูคอมเมนต์เดียวกันที่เทสต์ auto-scroll ด้านบน)
    scrollSpy.mockClear()
    renderForm({
      submitError: new ApiError('QUOTA_EXCEEDED', 'วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก', 422),
    })

    const errorText = screen.getByText('วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก')
    expect(errorText).toBeInTheDocument()
    expect(errorText).toHaveAttribute('role', 'alert')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
  })

  // บั๊กที่พบจากเทสจริง 2026-07-31: `dateRangeSectionRef` ครอบทั้ง `DateRangeField` (error อยู่บนสุด)
  // และ `LeavePeriodSection` (แถวต่อวันทำงาน — เลือกช่วงยาวหลายสิบวันสูงเกินจอ) scrollIntoView ที่
  // section ทั้งก้อนตรง ๆ จะเลื่อนผิดจุด (error หลุดขึ้นเหนือจอ) ต้องเลื่อนไปที่ wrapper เตี้ย ๆ ที่มี
  // ข้อความ error อยู่ข้างในแทน — เทสต์นี้ยืนยันว่า element ที่ถูก `scrollIntoView` จริง ๆ ไม่ใช่ section
  // ทั้งก้อน แต่เป็น wrapper ที่ `.contains()` ข้อความ error (พิสูจน์ผ่าน `mock.contexts` คือ `this` ตอน
  // เรียก method ไม่ใช่แค่ argument ที่ส่งเข้าไป)
  it('QUOTA_EXCEEDED → scrollIntoView ถูกเรียกที่ wrapper ที่มีข้อความ error อยู่ข้างใน ไม่ใช่ section ทั้งก้อน', () => {
    const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    scrollSpy.mockClear()
    renderForm({
      submitError: new ApiError('QUOTA_EXCEEDED', 'วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก', 422),
    })

    const errorText = screen.getByText('วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก')
    const [scrolledElement] = scrollSpy.mock.contexts
    if (!(scrolledElement instanceof HTMLElement)) throw new Error('scrollIntoView ไม่ถูกเรียก')
    expect(scrolledElement.contains(errorText)).toBe(true)

    const dateRangeSection = screen.getByText('ช่วงวันที่ลา').closest('section')
    expect(scrolledElement).not.toBe(dateRangeSection)
    // focus ยังคงยึด section container เดิมเสมอ (a11y canonical) แม้ scroll target เปลี่ยน
    expect(document.activeElement).toBe(dateRangeSection)
  })

  it('QUOTA_EXCEEDED → ปุ่มเลือกวันที่มี aria-invalid + aria-describedby ชี้ id ข้อความ error', () => {
    renderForm({
      submitError: new ApiError('QUOTA_EXCEEDED', 'วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก', 422),
    })

    const errorText = screen.getByText('วันลาคงเหลือไม่พอสำหรับช่วงวันที่เลือก')
    const dateButtons = [
      screen.getByRole('button', { name: 'วันที่เริ่ม' }),
      screen.getByRole('button', { name: 'ถึงวันที่' }),
    ]
    for (const button of dateButtons) {
      expect(button).toHaveAttribute('aria-invalid', 'true')
      expect(button).toHaveAttribute('aria-describedby', errorText.id)
    }
  })

  it('VALIDATION_ERROR (submitError prop) → โชว์ error เหนือปุ่มส่ง (root)', () => {
    renderForm({
      submitError: new ApiError('VALIDATION_ERROR', 'ข้อมูลคำขอลาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 422),
    })

    expect(screen.getByText('ข้อมูลคำขอลาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง')).toBeInTheDocument()
  })

  it('error code อื่น (เช่น NETWORK_ERROR) → toast แทนการผูก field', async () => {
    renderForm({
      submitError: new ApiError('NETWORK_ERROR', 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต', 0),
    })

    expect(await screen.findByText('เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต')).toBeInTheDocument()
  })

  it('isPending=true → ปุ่มส่ง disabled + โชว์ pendingText', () => {
    renderForm({ isPending: true })

    const submitButton = screen.getByRole('button', { name: /กำลังส่ง/ })
    expect(submitButton).toBeDisabled()
  })

  it('แนบไฟล์ประเภทที่รองรับ → โชว์รายการไฟล์ + ลบได้', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LeaveForm
        balances={BALANCES}
        holidays={[]}
        teammates={TEAMMATES}
        approverName="นายวิชัย มั่นคง"
        isPending={false}
        submitError={null}
        onSubmit={vi.fn()}
      />,
    )

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!fileInput) throw new Error('ไม่พบ input[type=file]')
    const file = new File(['dummy'], 'ใบจองที่พัก.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    expect(await screen.findByText('ใบจองที่พัก.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ลบไฟล์แนบ' }))
    expect(screen.queryByText('ใบจองที่พัก.pdf')).not.toBeInTheDocument()
  })

  it('แนบไฟล์ประเภทที่ไม่รองรับ (.docx) → ไม่เพิ่มเข้ารายการ', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LeaveForm
        balances={BALANCES}
        holidays={[]}
        teammates={TEAMMATES}
        approverName="นายวิชัย มั่นคง"
        isPending={false}
        submitError={null}
        onSubmit={vi.fn()}
      />,
    )

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!fileInput) throw new Error('ไม่พบ input[type=file]')
    const file = new File(['dummy'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    await user.upload(fileInput, file)

    expect(screen.queryByText('resume.docx')).not.toBeInTheDocument()
  })
})
