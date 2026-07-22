/**
 * features/leave/components/CancelConfirmSheet.tsx — Drawer ยืนยันยกเลิกใบลา (S13, P15 §3.8)
 * เข้าชุดกับ `RemoteReasonSheet` (attendance) — Drawer หุ้ม + safe-area + ปุ่มปิดชัดเจนตาม §10.2
 * ไม่ใช้ `dismissible={false}` (กับดัก P6 — ต้องปัดปิด/กดปุ่ม X ได้เสมอ)
 *
 * presentational + control เบา ๆ (open/close state ของ Drawer เอง) — ไม่ยิง mutation ในนี้ตรง ๆ
 * รับ `onConfirm` จาก page (`LeaveDetailPage` เป็นคนถือ `useCancelLeave` และตัดสิน toast/navigate)
 */
import { Drawer } from '@/components/Drawer'
import { DangerSoftButton } from '@/components/DangerSoftButton'
import { GhostButton } from '@/components/GhostButton'

interface CancelConfirmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function CancelConfirmSheet({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CancelConfirmSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="ยกเลิกคำขอลา">
      <div className="flex flex-col gap-4 pt-2 pb-2">
        <p className="text-sm text-text-secondary">
          ยืนยันยกเลิกคำขอลานี้? เมื่อยกเลิกแล้วจะไม่สามารถกู้คืนได้ ต้องยื่นคำขอใหม่หากต้องการลาอีกครั้ง
        </p>
        <DangerSoftButton
          shape="pill"
          onClick={onConfirm}
          isPending={isPending}
          pendingText="กำลังยกเลิก..."
        >
          ยืนยันยกเลิกคำขอ
        </DangerSoftButton>
        <GhostButton shape="pill" onClick={() => onOpenChange(false)} disabled={isPending}>
          ไม่ยกเลิก
        </GhostButton>
      </div>
    </Drawer>
  )
}
