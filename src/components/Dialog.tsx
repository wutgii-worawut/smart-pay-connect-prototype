/**
 * components/Dialog.tsx — modal กลางจอ (hand-vendor จาก @radix-ui/react-dialog, architecture.md §10.1-10.2)
 * copy source มา restyle ด้วย token เราตรง ๆ (ไม่ใช้ shadcn CLI) — แอปนี้เน้นมือถือใช้ Drawer เป็นหลัก
 * (§10.2: bottom sheet ได้เปรียบเรื่อง swipe ปิด) เก็บ Dialog ไว้เผื่อจอที่ design ระบุ modal กลางจอจริง ๆ
 */
import type { ReactNode } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
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

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-primary-dark/40" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-card outline-none">
          <div className="flex items-center justify-between gap-4">
            <RadixDialog.Title className="text-lg font-semibold text-primary-dark">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label="ปิด"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface"
            >
              <CloseIcon />
            </RadixDialog.Close>
          </div>
          <div className="mt-3">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
