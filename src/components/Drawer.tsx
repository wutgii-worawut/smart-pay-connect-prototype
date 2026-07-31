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
 *
 * 🔴 `repositionInputs={false}` — จงใจ ห้ามเอาออก (ผู้ใช้เจอบั๊กบนเครื่องจริง 2026-07-31)
 * ค่า default ของ vaul คือ true = vaul ดัก visualViewport แล้ว **ยัด inline style.height/style.bottom
 * ทับ Content เอง** ซึ่งพังใน LIFF webview ทั้งสอง platform คนละแบบ:
 * - Android (vaul#538): innerHeight กับ visualViewport.height หดไม่พร้อมกันตอนคีย์บอร์ดเด้ง →
 *   heuristic desync → restore ไม่ครบ inline height/bottom ค้าง → div overflow-y-auto ด้านล่าง
 *   กลายเป็น scroll ทั้งที่เนื้อหาสั้น
 * - iOS (vaul#619): WKWebView ดัน fixed element ขึ้นเองอยู่แล้ว (scroll visual viewport) แต่ vaul
 *   ไม่อ่าน offsetTop ยังเซ็ต bottom เพิ่มอีก = ชดเชยสองเด้ง → Drawer หลุดพ้นขอบบนจอ
 * ปิดแล้วคืนให้ native จัดการ (Android adjustResize / iOS scroll รอบเดียว) — vaul 1.1.2 เป็นเวอร์ชัน
 * ล่าสุดบน npm (ไม่มี release ตั้งแต่ปลายปี 2024) PR แก้ยัง open จึง upgrade หนีไม่ได้
 *
 * ⚠️ prop นี้คุม 2 อย่างใน vaul ไม่ใช่อย่างเดียว:
 * 1. visualViewport handler ข้างบน — เข้าเงื่อนไขเฉพาะเมื่อ activeElement เป็น input/textarea
 *    จึงไม่เคยแตะ CancelConfirmSheet/HolidayDetails/DateRangeField (ปุ่มวันเป็น <button> ไม่ใช่ input)
 * 2. `usePreventScroll` — ปิดตามไปด้วย **ทุก Drawer แต่มีผลเฉพาะ iOS** (hook นี้ no-op บน Android):
 *    เสีย preventScrollMobileSafari (pin window scroll + preventDefault touchmove + scrollIntoView
 *    ตอน focus input) เหลือ RemoveScroll ของ Radix Dialog (modal default true) ล็อก body scroll
 *    (+ อาจมี usePositionFixed body-pin ของ vaul ช่วยอีกชั้น แต่ทำงานเฉพาะเมื่อ UA match Safari
 *    ซึ่ง LINE webview ไม่แน่) — **ยังไม่พิสูจน์บนเครื่อง iOS ว่าพอ** ดู checklist §21.4. การเสีย scrollIntoView-on-focus
 *    ตัวนี้คือเหตุผลที่ iOS อาจต้อง contingency onFocus→scrollIntoView ที่ textarea
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
    <VaulDrawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      repositionInputs={false}
    >
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
