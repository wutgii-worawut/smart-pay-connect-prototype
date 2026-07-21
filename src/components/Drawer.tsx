/**
 * components/Drawer.tsx — bottom sheet ลอยขึ้นจากล่าง (hand-vendor จาก vaul, architecture.md §10.2)
 * copy source มา restyle ด้วย token เราตรง ๆ (ไม่ใช้ shadcn CLI ตามที่ผู้ใช้เคาะ P4)
 * ใช้กับ RemoteReasonSheet/CancelConfirmSheet/DayDetailSheet (เฟสหลัง)
 *
 * บังคับตาม §10.2 checklist:
 * - padding ล่างกัน safe-area ใน Drawer เอง: pb-[calc(1.5rem+env(safe-area-inset-bottom))]
 * - มีปุ่มปิดชัดเจนเสมอ (ไม่พึ่ง swipe gesture ทางเดียว)
 * - dismissible เปิดเป็นค่าเริ่มต้น (จุดขายของ bottom sheet) — ปิดได้ผ่าน prop ถ้าเจอปัญหาตีกับ
 *   gesture ปัดปิด LIFF ของ LINE บนเครื่องจริง (ต้องทดสอบเครื่องจริงก่อนปิด ตาม checklist §10.2)
 */
import type { ReactNode } from 'react'
import { Drawer as VaulDrawer } from 'vaul'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** หัวข้อ Drawer — บังคับเสมอ (a11y + ตาม §10.2 ต้องมีบริบทชัดเจนคู่กับปุ่มปิด) */
  title: string
  children: ReactNode
  dismissible?: boolean
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Drawer({ open, onOpenChange, title, children, dismissible = true }: DrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-40 bg-primary-dark/40" />
        <VaulDrawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-card bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-card outline-none">
          <div
            className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-text-secondary/30"
            aria-hidden="true"
          />
          <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
            <VaulDrawer.Title className="text-lg font-semibold text-primary-dark">
              {title}
            </VaulDrawer.Title>
            <VaulDrawer.Close
              aria-label="ปิด"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface"
            >
              <CloseIcon />
            </VaulDrawer.Close>
          </div>
          <div className="overflow-y-auto px-5">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}
