/**
 * app/ErrorBoundary.tsx — ตาข่ายสุดท้ายระดับแอป (§20.1)
 * ครอบใน providers.tsx ใต้ LiffGate — กันจอขาวเมื่อมี error หลุดจากที่ router `errorElement`
 * จับไม่ถึง (เช่น error ระหว่าง render ของ QueryClientProvider/RouterProvider เอง)
 *
 * ต้องเป็น class component — React ยังไม่มี hook-based error boundary
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // ห้าม log token/JWT/พิกัด/เงินเดือน — log เฉพาะ error message/stack เพื่อ debug
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
          <p className="text-lg font-semibold text-primary-dark">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-text-secondary">กรุณาลองโหลดหน้าใหม่อีกครั้ง</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white"
          >
            โหลดใหม่
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
