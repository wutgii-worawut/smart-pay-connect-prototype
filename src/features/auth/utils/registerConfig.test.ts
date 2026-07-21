import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAllowedEmailDomain, getRegisterMode } from './registerConfig'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getRegisterMode', () => {
  it('ไม่ตั้ง env → fallback "both"', () => {
    vi.stubEnv('VITE_REGISTER_MODE', undefined)
    expect(getRegisterMode()).toBe('both')
  })

  it('"form" → "form"', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'form')
    expect(getRegisterMode()).toBe('form')
  })

  it('"thaid" → "thaid"', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'thaid')
    expect(getRegisterMode()).toBe('thaid')
  })

  it('"both" → "both"', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'both')
    expect(getRegisterMode()).toBe('both')
  })

  it('ค่าไม่รู้จัก → fallback "both"', () => {
    vi.stubEnv('VITE_REGISTER_MODE', 'nonsense')
    expect(getRegisterMode()).toBe('both')
  })
})

describe('getAllowedEmailDomain', () => {
  it('ไม่ตั้ง env → undefined (ไม่จำกัดโดเมน)', () => {
    vi.stubEnv('VITE_ALLOWED_EMAIL_DOMAIN', undefined)
    expect(getAllowedEmailDomain()).toBeUndefined()
  })

  it('ตั้งเป็นค่าว่าง → undefined', () => {
    vi.stubEnv('VITE_ALLOWED_EMAIL_DOMAIN', '   ')
    expect(getAllowedEmailDomain()).toBeUndefined()
  })

  it('ตั้งค่า → คืน lowercase ตัดช่องว่าง', () => {
    vi.stubEnv('VITE_ALLOWED_EMAIL_DOMAIN', '  AP.GO.TH  ')
    expect(getAllowedEmailDomain()).toBe('ap.go.th')
  })
})
