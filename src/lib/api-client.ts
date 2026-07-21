/**
 * lib/api-client.ts — axios instance เดียวของทั้งแอป (§20.3)
 *
 * - unwrap envelope `{ data }` (§16.1) อัตโนมัติ → caller ได้ payload ตรง ๆ
 * - normalize ทุก error (รวม network ล้ม) เป็น `ApiError { code, message, status }`
 * - แนบ JWT ผ่าน `setAuthToken()` (setter pattern — lib ห้าม import จาก features, กฎเหล็ก §6)
 * - แนบ header กัน ngrok interstitial เมื่อ baseURL ชี้ ngrok (plan.md §1.5)
 * - ดัก code กลาง (ID_TOKEN_EXPIRED / UNAUTHORIZED) แล้วเรียก callback ที่ P8 (auth) จะ set ให้
 *   — ไม่ผูก liff.logout()/liff.login() ตรงนี้ (อยู่นอกขอบเขต P2)
 *
 * ⚠️ ห้าม log token/JWT/พิกัด/เงินเดือน ลง console ที่นี่หรือที่ไหนใน production path
 */
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

/** error รูปเดียวที่ทุกจุดในแอปเจอ — ไม่มี error ดิบของ axios หลุดถึง UI */
export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** envelope ตาม §16.1 */
interface ErrorEnvelope {
  error?: { code: string; message: string }
}

// --- JWT: module-level state, set ผ่าน setter (lib ห้าม import features) ---
let authToken: string | null = null

/** เรียกหลัง login สำเร็จ / logout เพื่อล้าง token (auth feature, P8) */
export const setAuthToken = (token: string | null): void => {
  authToken = token
}

// --- code กลางที่ต้อง hook แต่ implement จริงอยู่นอกขอบเขต P2 ---
type ApiErrorHandler = (error: ApiError) => void

let onIdTokenExpired: ApiErrorHandler | null = null
let onUnauthorized: ApiErrorHandler | null = null

/** P8 (auth) จะ set handler นี้เป็น `liff.logout()` + `liff.login()` (§13.3) */
export const setOnIdTokenExpired = (handler: ApiErrorHandler | null): void => {
  onIdTokenExpired = handler
}

/** P8 (auth) จะ set handler นี้เป็นล้าง session + พาไป auth ใหม่ (§13.1) */
export const setOnUnauthorized = (handler: ApiErrorHandler | null): void => {
  onUnauthorized = handler
}

const baseURL = import.meta.env.VITE_API_URL

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
})

axiosInstance.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`)
  }
  // เลี่ยง ngrok free interstitial (plan.md §1.5) — เช็คจาก host ของ baseURL ที่ request จริงใช้
  // เข้มเป็น "ลงท้ายด้วย .ngrok-free.dev" กัน false positive กับโดเมนอื่นที่บังเอิญมีคำว่า ngrok
  const requestBaseURL = config.baseURL ?? ''
  const requestHost = (() => {
    try {
      return new URL(requestBaseURL).hostname
    } catch {
      return ''
    }
  })()
  if (requestHost.endsWith('.ngrok-free.dev')) {
    config.headers.set('ngrok-skip-browser-warning', '1')
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res.data.data,
  (err: AxiosError<ErrorEnvelope>) => {
    // ไม่มี response เลย = network ล้ม (สัญญาณวูบ — ปกติมากบนมือถือ) — สร้างโดย client (§16.2)
    if (!err.response) {
      throw new ApiError('NETWORK_ERROR', 'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต', 0)
    }

    const body = err.response.data?.error
    const apiErr = new ApiError(
      body?.code ?? 'UNKNOWN',
      body?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      err.response.status,
    )

    // ดัก code กลางที่จุดเดียว (§16.2) — implement จริงมาจาก P8 ผ่าน setter ข้างบน
    if (apiErr.code === 'ID_TOKEN_EXPIRED') onIdTokenExpired?.(apiErr)
    if (apiErr.code === 'UNAUTHORIZED' || apiErr.code === 'MISSING_TOKEN' || apiErr.code === 'INVALID_TOKEN') {
      onUnauthorized?.(apiErr)
    }

    throw apiErr // code เฉพาะงานไหลต่อให้ feature จัดการ
  },
)

/**
 * axios แกะ envelope `{ data }` ที่ interceptor แล้ว (คืน payload ตรง ๆ ไม่ใช่ AxiosResponse)
 * เลยห่อ instance ด้วย wrapper ที่ประกาศ generic ตัวที่สอง (`R`) ของ axios ตรง ๆ ว่า response
 * คือ `T` เอง แทนการ cast — ไม่มี `as`/`any` ที่จุดนี้ TS เช็ค structural จริงทั้งหมด
 */
export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
}

export const api: ApiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T, T>(url, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<T, T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, T>(url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, T>(url, data, config),
}
