import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { LiffProvider } from './LiffProvider'
import { LiffContext } from './liff-context'

function StatusProbe() {
  const state = useContext(LiffContext)
  return <p>สถานะ: {state.status}</p>
}

describe('LiffProvider (โหมด mock)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_LIFF_MOCK', 'true')
    vi.stubEnv('VITE_LIFF_ID', '2000000000-devMock')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('เข้าสถานะ ready ได้เอง โดยไม่ค้างที่ loading (liff-mock ไม่ล็อกอินอัตโนมัติ ต้อง set isLoggedIn เอง)', async () => {
    render(
      <LiffProvider>
        <StatusProbe />
      </LiffProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('สถานะ: ready')).toBeInTheDocument()
    })
  })
})
