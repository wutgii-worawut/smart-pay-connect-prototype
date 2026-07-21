import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AppToaster } from '@/components/Toaster'
import { authHandlers, setRegisterOtpScenario } from '@/mocks/handlers/auth'
import { RegisterForm } from './RegisterForm'
import { useRegisterStore } from '../stores/registerStore'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  setRegisterOtpScenario('success')
  useRegisterStore.getState().clearPendingOtp()
  vi.unstubAllEnvs()
})
afterAll(() => server.close())

/** id ที่ checksum ถูกต้อง (คำนวณด้วยสูตรกรมการปกครองมือ: sum=352, check=1) */
const VALID_CITIZEN_ID_DIGITS = '1234567890121'
const INVALID_CHECKSUM_DIGITS = '1234567890122'

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  const router = createMemoryRouter(
    [
      {
        path: '/register',
        element: (
          <>
            <AppToaster />
            <RegisterForm />
          </>
        ),
      },
      { path: '/register/otp', element: <p>หน้ายืนยัน OTP</p> },
    ],
    { initialEntries: ['/register'] },
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/เลขประจำตัวประชาชน/), VALID_CITIZEN_ID_DIGITS)
  await user.type(screen.getByLabelText(/อีเมล/), 'spuser@sp.go.th')
}

describe('RegisterForm', () => {
  it('render ช่องเลขบัตรประชาชน + อีเมล + ปุ่มลงทะเบียน', () => {
    renderForm()

    expect(screen.getByLabelText(/เลขประจำตัวประชาชน/)).toBeInTheDocument()
    expect(screen.getByLabelText(/อีเมล/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ลงทะเบียน/ })).toBeInTheDocument()
  })

  it('ส่งฟอร์มว่าง → โชว์ error ทั้งสองช่อง ไม่ยิง API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('กรุณากรอกเลขประจำตัวประชาชน')).toBeInTheDocument()
    expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument()
  })

  it('เลขบัตรประชาชนกรอกไม่ครบ 13 หลัก → error ครบ 13 หลัก', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/เลขประจำตัวประชาชน/), '123')
    await user.type(screen.getByLabelText(/อีเมล/), 'spuser@sp.go.th')
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(
      await screen.findByText('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก'),
    ).toBeInTheDocument()
  })

  it('เลขบัตรประชาชนครบ 13 หลักแต่ checksum ผิด → error เลขไม่ถูกต้อง', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/เลขประจำตัวประชาชน/), INVALID_CHECKSUM_DIGITS)
    await user.type(screen.getByLabelText(/อีเมล/), 'spuser@sp.go.th')
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('เลขประจำตัวประชาชนไม่ถูกต้อง')).toBeInTheDocument()
  })

  it('อีเมลรูปแบบผิด → error รูปแบบอีเมลไม่ถูกต้อง', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/เลขประจำตัวประชาชน/), VALID_CITIZEN_ID_DIGITS)
    await user.type(screen.getByLabelText(/อีเมล/), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument()
  })

  it('ตั้ง VITE_ALLOWED_EMAIL_DOMAIN แล้วอีเมลลงท้ายผิด domain → error บอก domain', async () => {
    vi.stubEnv('VITE_ALLOWED_EMAIL_DOMAIN', 'ap.go.th')
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/เลขประจำตัวประชาชน/), VALID_CITIZEN_ID_DIGITS)
    await user.type(screen.getByLabelText(/อีเมล/), 'spuser@sp.go.th')
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('กรุณาใช้อีเมลขององค์กร (@ap.go.th)')).toBeInTheDocument()
  })

  it('กรอกถูกต้อง + สำเร็จ → เก็บ email/refCode ใน store + navigate ไป /register/otp', async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('หน้ายืนยัน OTP')).toBeInTheDocument()
    expect(useRegisterStore.getState().pendingOtp).toEqual({
      email: 'spuser@sp.go.th',
      refCode: 'REF-1234',
      citizenId: VALID_CITIZEN_ID_DIGITS,
    })
  })

  it('EMPLOYEE_NOT_FOUND → โชว์ข้อความไม่พบข้อมูลใต้ช่องเลขบัตรประชาชน ไม่ navigate', async () => {
    setRegisterOtpScenario('employee_not_found')
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    const message = 'ไม่พบข้อมูลพนักงาน กรุณาติดต่อฝ่ายบุคคล (HR)'
    await waitFor(() =>
      expect(screen.getByLabelText(/เลขประจำตัวประชาชน/).parentElement).toHaveTextContent(
        message,
      ),
    )
    // ไม่ใช่อีเมล — ยืนยันว่า error ผูกกับช่องเลขบัตรจริง ไม่ใช่โผล่ลอย ๆ ที่อื่น
    expect(screen.getByLabelText(/อีเมล/).parentElement).not.toHaveTextContent(message)
    expect(screen.queryByText('หน้ายืนยัน OTP')).not.toBeInTheDocument()
  })

  it('VALIDATION_ERROR → โชว์ข้อความใต้ช่องเลขบัตรประชาชน (best-effort) ไม่ navigate', async () => {
    setRegisterOtpScenario('validation_error')
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    const message = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบเลขประจำตัวประชาชนหรืออีเมลอีกครั้ง'
    await waitFor(() =>
      expect(screen.getByLabelText(/เลขประจำตัวประชาชน/).parentElement).toHaveTextContent(
        message,
      ),
    )
    expect(screen.queryByText('หน้ายืนยัน OTP')).not.toBeInTheDocument()
  })

  it('OTP_RATE_LIMITED → แสดง toast บอกเวลารอ ไม่ผูก field', async () => {
    setRegisterOtpScenario('rate_limited')
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    const message = 'ขอรหัส OTP บ่อยเกินไป กรุณารออีก 5 นาทีแล้วลองใหม่'
    expect(await screen.findByText(message)).toBeInTheDocument()
    // ไม่ผูกกับช่องเลขบัตร (ไม่ใช่ field-level error)
    expect(screen.getByLabelText(/เลขประจำตัวประชาชน/).parentElement).not.toHaveTextContent(
      message,
    )
  })

  it('ApiError code อื่นที่ไม่รู้จัก (เช่น NETWORK_ERROR) → toast ด้วย error.message', async () => {
    server.use(
      http.post('/auth/register/request-otp', () => HttpResponse.error()),
    )
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(
      await screen.findByText('เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'),
    ).toBeInTheDocument()
  })

  it('response ไม่ตรง contract (ไม่ใช่ ApiError เช่น ZodError) → toast ไทย fallback คงที่', async () => {
    server.use(
      http.post('/auth/register/request-otp', () =>
        HttpResponse.json({ data: { email: 'spuser@sp.go.th' } }), // ไม่มี refCode → Zod parse fail
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    expect(await screen.findByText('เกิดข้อผิดพลาด กรุณาลองใหม่')).toBeInTheDocument()
  })

  it('mutation ไม่ retry อัตโนมัติเมื่อ error (retry:0)', async () => {
    let callCount = 0
    server.use(
      http.post('/auth/register/request-otp', () => {
        callCount += 1
        return HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'ข้อมูลไม่ถูกต้อง' } },
          { status: 400 },
        )
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /ลงทะเบียน/ }))

    await waitFor(() =>
      expect(screen.getByLabelText(/เลขประจำตัวประชาชน/).parentElement).toHaveTextContent(
        'ข้อมูลไม่ถูกต้อง',
      ),
    )
    expect(callCount).toBe(1)
  })

  it('ปุ่ม disabled ระหว่าง isPending (ก่อน response ตอบกลับ)', async () => {
    let resolveResponse: (() => void) | undefined
    server.use(
      http.post('/auth/register/request-otp', async () => {
        await new Promise<void>((resolve) => {
          resolveResponse = resolve
        })
        return HttpResponse.json({ data: { refCode: 'REF-1234', email: 'spuser@sp.go.th' } })
      }),
    )
    const user = userEvent.setup()
    renderForm()
    await fillValidForm(user)

    const submitButton = screen.getByRole('button', { name: /ลงทะเบียน/ })
    await user.click(submitButton)

    await waitFor(() => expect(submitButton).toBeDisabled())

    resolveResponse?.()

    await waitFor(() => expect(screen.getByText('หน้ายืนยัน OTP')).toBeInTheDocument())
  })
})
