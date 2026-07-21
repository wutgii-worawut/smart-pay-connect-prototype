/**
 * components/toast.tsx — helper เรียก toast (S7) จาก mutation onSuccess/onError (§20.4)
 * แยกจาก components/Toaster.tsx เพราะ eslint-plugin-react-refresh (only-export-components)
 * ห้ามไฟล์เดียวกัน export component (AppToaster/ToastPill) ปนกับ function ธรรมดา
 */
import { toast } from 'sonner'
import { ToastPill } from './Toaster'

/** แสดง toast สำเร็จ (เขียว) — เช่น อนุมัติแล้ว/ยกเลิกคำขอแล้ว/ส่งอีเมลแล้ว */
export function toastSuccess(message: string): void {
  toast.custom(() => <ToastPill message={message} tone="success" />)
}

/** แสดง toast ผิดพลาด (แดง) — ใช้กับ ApiError.message ใน mutation onError (ไทยแสดงตรง §20.3) */
export function toastError(message: string): void {
  toast.custom(() => <ToastPill message={message} tone="error" />)
}
