import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AppToaster } from '@/components/Toaster'
import { authHandlers, setVerifyOtpScenario } from '@/mocks/handlers/auth'
import { OtpPage } from './OtpPage'
import { useAuthStore } from '../stores/authStore'
import { useRegisterStore } from '../stores/registerStore'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  setVerifyOtpScenario('success')
  useRegisterStore.getState().clearPendingOtp()
  useAuthStore.getState().clearSession()
  vi.useRealTimers()
})
afterAll(() => server.close())

function seedPendingOtp() {
  useRegisterStore.getState().setPendingOtp({
    email: 'spuser@sp.go.th',
    refCode: 'REF-1234',
    citizenId: '1234567890121',
  })
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
  const router = createMemoryRouter(
    [
      { path: '/register', element: <p>หน้าลงทะเบียน</p> },
      {
        path: '/register/otp',
        element: (
          <>
            <AppToaster />
            <OtpPage />
          </>
        ),
      },
      { path: '/register/success', element: <p>หน้าลงทะเบียนสำเร็จ</p> },
    ],
    { initialEntries: ['/register/otp'] },
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

async function typeOtp(user: ReturnType<typeof userEvent.setup>, code: string) {
  for (let index = 0; index < code.length; index += 1) {
    const cell = screen.getByLabelText(`ตัวที่ ${index + 1} จาก 6`)
    await user.type(cell, code[index])
  }
}

describe('OtpPage', () => {
  it('pendingOtp เป็น null (เข้าตรง ๆ ไม่ผ่านฟอร์ม) → เด้งกลับ /register', () => {
    renderPage()

    expect(screen.getByText('หน้าลงทะเบียน')).toBeInTheDocument()
  })

  it('มี pendingOtp → render chip อีเมล + เลขอ้างอิง OTP', () => {
    seedPendingOtp()
    renderPage()

    expect(screen.getByText('spuser@sp.go.th')).toBeInTheDocument()
    expect(screen.getByText(/REF-1234/)).toBeInTheDocument()
  })

  it('ปุ่มยืนยัน disabled จนกว่า OTP จะครบ regex 6 ตัว', async () => {
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    const submitButton = screen.getByRole('button', { name: /ยืนยัน/ })
    expect(submitButton).toBeDisabled()

    await typeOtp(user, 'A1B2C')
    expect(submitButton).toBeDisabled()

    await user.type(screen.getByLabelText('ตัวที่ 6 จาก 6'), '3')
    await waitFor(() => expect(submitButton).toBeEnabled())
  })

  it('พิมพ์ OTP ไม่ครบ (ยังไม่กด submit) → ไม่มี error text/border แดงโผล่ระหว่างกรอก (F1)', async () => {
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('ตัวที่ 1 จาก 6'), 'A')

    expect(
      screen.queryByText('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก'),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('ตัวที่ 1 จาก 6')).not.toHaveClass('border-danger')
  })

  it('OTP ยาว 6 แต่มี space แทรกกลาง (ลบตัวกลางแล้ว) → ปุ่มยืนยัน disabled (ห้ามเช็คแค่ length)', async () => {
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await typeOtp(user, 'A1B2C3')
    const submitButton = screen.getByRole('button', { name: /ยืนยัน/ })
    await waitFor(() => expect(submitButton).toBeEnabled())

    // ลบตัวอักษรช่องกลาง (index 2 = 'B') → ค่ารวมยาว 6 ตำแหน่งเหมือนเดิมแต่มี space แทรก
    const middleCell = screen.getByLabelText('ตัวที่ 3 จาก 6')
    await user.clear(middleCell)

    expect(submitButton).toBeDisabled()
  })

  it('verify สำเร็จ → setSession เข้า authStore + navigate ไป /register/success', async () => {
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await typeOtp(user, 'A1B2C3')
    await user.click(screen.getByRole('button', { name: /ยืนยัน/ }))

    expect(await screen.findByText('หน้าลงทะเบียนสำเร็จ')).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('mock-jwt-token-register')
  })

  it('OTP_INVALID → error ใต้ช่อง OTP ไม่ navigate', async () => {
    setVerifyOtpScenario('otp_invalid')
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await typeOtp(user, 'A1B2C3')
    await user.click(screen.getByRole('button', { name: /ยืนยัน/ }))

    expect(
      await screen.findByText('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'),
    ).toBeInTheDocument()
    expect(screen.queryByText('หน้าลงทะเบียนสำเร็จ')).not.toBeInTheDocument()
  })

  it('OTP_EXPIRED → toast แจ้ง + เปิดให้กดส่งรหัสอีกครั้งได้ทันที (ไม่ต้องรอ countdown)', async () => {
    setVerifyOtpScenario('otp_expired')
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    const resendButton = screen.getByRole('button', { name: /ส่งรหัสอีกครั้ง/ })
    expect(resendButton).toBeDisabled()

    await typeOtp(user, 'A1B2C3')
    await user.click(screen.getByRole('button', { name: /ยืนยัน/ }))

    expect(await screen.findByText('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่')).toBeInTheDocument()
    await waitFor(() => expect(resendButton).toBeEnabled())
  })

  it('mutation verify-otp ไม่ retry อัตโนมัติ (retry:0)', async () => {
    let callCount = 0
    server.use(
      http.post('/auth/register/verify-otp', () => {
        callCount += 1
        return HttpResponse.json(
          { error: { code: 'OTP_INVALID', message: 'รหัส OTP ไม่ถูกต้อง' } },
          { status: 400 },
        )
      }),
    )
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await typeOtp(user, 'A1B2C3')
    await user.click(screen.getByRole('button', { name: /ยืนยัน/ }))

    await waitFor(() => expect(screen.getByText('รหัส OTP ไม่ถูกต้อง')).toBeInTheDocument())
    expect(callCount).toBe(1)
  })

  it('ปุ่มยืนยัน disabled ระหว่าง isPending (ก่อน response ตอบกลับ)', async () => {
    let resolveResponse: (() => void) | undefined
    server.use(
      http.post('/auth/register/verify-otp', async () => {
        await new Promise<void>((resolve) => {
          resolveResponse = resolve
        })
        return HttpResponse.json({
          data: { token: 't', employee: { id: 'e1', name: 'สมชาย', role: 'employee' } },
        })
      }),
    )
    seedPendingOtp()
    const user = userEvent.setup()
    renderPage()

    await typeOtp(user, 'A1B2C3')
    const submitButton = screen.getByRole('button', { name: /ยืนยัน/ })
    await user.click(submitButton)

    await waitFor(() => expect(submitButton).toBeDisabled())
    resolveResponse?.()

    await waitFor(() => expect(screen.getByText('หน้าลงทะเบียนสำเร็จ')).toBeInTheDocument())
  })

  it('ปุ่มส่งรหัสอีกครั้ง disabled ตอนเริ่ม (countdown) แล้วเปิดใช้ได้เมื่อ countdown หมด', () => {
    vi.useFakeTimers()
    seedPendingOtp()
    renderPage()

    const resendButton = screen.getByRole('button', { name: /ส่งรหัสอีกครั้ง/ })
    expect(resendButton).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(resendButton).toBeEnabled()
  })

  it('กดส่งรหัสอีกครั้ง (พร้อมแล้ว) → เรียก requestOtp ใหม่ อัปเดต refCode ใน store + จอ', async () => {
    setVerifyOtpScenario('otp_expired')
    seedPendingOtp()
    const user = userEvent.setup()

    server.use(
      http.post('/auth/register/request-otp', () =>
        HttpResponse.json({ data: { refCode: 'REF-9999', email: 'spuser@sp.go.th' } }),
      ),
    )

    renderPage()

    // ทำให้ error OTP_EXPIRED ก่อน เพื่อเปิดปุ่มส่งซ้ำได้ทันทีโดยไม่ต้องรอ countdown จริงในเทสต์
    await typeOtp(user, 'A1B2C3')
    await user.click(screen.getByRole('button', { name: /ยืนยัน/ }))
    await screen.findByText('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่')

    const resendButton = screen.getByRole('button', { name: /ส่งรหัสอีกครั้ง/ })
    await waitFor(() => expect(resendButton).toBeEnabled())

    await user.click(resendButton)

    await waitFor(() => expect(screen.getByText(/REF-9999/)).toBeInTheDocument())
    expect(useRegisterStore.getState().pendingOtp?.refCode).toBe('REF-9999')
  })
})
