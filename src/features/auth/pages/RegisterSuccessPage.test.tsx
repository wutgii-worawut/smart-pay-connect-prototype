import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { RegisterSuccessPage } from './RegisterSuccessPage'
import { useAuthStore } from '../stores/authStore'
import { useRegisterStore } from '../stores/registerStore'

beforeEach(() => {
  useRegisterStore.getState().setPendingOtp({
    email: 'spuser@sp.go.th',
    refCode: 'REF-1234',
    citizenId: '1234567890121',
  })
  // เข้าเพจนี้ได้ตามปกติต้องผ่าน verify-otp สำเร็จมาก่อน (setSession แล้วที่ OtpPage) — จำลองไว้
  useAuthStore.getState().setSession('jwt-register', { id: 'e1', name: 'สมชาย', role: 'employee' })
})

afterEach(() => {
  useAuthStore.getState().clearSession()
  useRegisterStore.getState().clearPendingOtp()
})

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/register', element: <p>หน้าลงทะเบียน</p> },
      { path: '/register/success', element: <RegisterSuccessPage /> },
      { path: '/', element: <p>หน้าแรก</p> },
    ],
    { initialEntries: ['/register/success'] },
  )

  return render(<RouterProvider router={router} />)
}

describe('RegisterSuccessPage', () => {
  it('render หัวข้อ "ลงทะเบียนสำเร็จ" + ปุ่มกลับหน้าแรก', () => {
    renderPage()

    expect(screen.getByText('ลงทะเบียนสำเร็จ')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /กลับหน้า SmartPay Connect/ }),
    ).toBeInTheDocument()
  })

  it('mount แล้วเคลียร์ pendingOtp ทันที (ปิด flow register ทั้งวง)', () => {
    expect(useRegisterStore.getState().pendingOtp).not.toBeNull()

    renderPage()

    expect(useRegisterStore.getState().pendingOtp).toBeNull()
  })

  it('กดปุ่ม "กลับหน้า SmartPay Connect" → navigate ไปหน้าแรก', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /กลับหน้า SmartPay Connect/ }))

    expect(await screen.findByText('หน้าแรก')).toBeInTheDocument()
  })

  it('เปิด URL ตรง ๆ โดยไม่มี session (ไม่เคย verify-otp สำเร็จ) → เด้งกลับ /register (กัน "จอสำเร็จหลอก")', () => {
    useAuthStore.getState().clearSession()

    renderPage()

    expect(screen.getByText('หน้าลงทะเบียน')).toBeInTheDocument()
    expect(screen.queryByText('ลงทะเบียนสำเร็จ')).not.toBeInTheDocument()
  })
})
