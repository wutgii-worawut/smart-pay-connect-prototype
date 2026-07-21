/**
 * features/attendance/components/RemoteReasonSheet.tsx — Drawer กรอกเหตุผลก่อนลงเวลานอกสถานที่
 * (feature-plans/02, §10.2 checklist) — ไม่มี PNG อ้างอิงตรง ๆ (10 จอ design ไม่มีจอนี้แยก) ออกแบบ
 * ให้เข้าชุดกับฟอร์มอื่นในแอป (RHF + Zod v4 ตามกฎ code-style.md)
 *
 * ⚠️ Remote clock policy ยังไม่เคาะ (open question §23.1#4) — ทำแค่กรอกเหตุผล+ส่งพิกัด ตามที่ระบุ
 * ห้ามเพิ่ม flow แจ้งเตือน/รอหัวหน้ารับทราบเอง
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Drawer } from '@/components/Drawer'
import { PrimaryButton } from '@/components/PrimaryButton'
import { Textarea } from '@/components/Textarea'

const remoteReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'กรุณาระบุเหตุผลที่ไปทำงานนอกสถานที่')
    .max(500, 'เหตุผลยาวเกินไป (ไม่เกิน 500 ตัวอักษร)'),
})

type RemoteReasonFormValues = z.infer<typeof remoteReasonSchema>

interface RemoteReasonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitReason: (reason: string) => void
  isPending: boolean
}

export function RemoteReasonSheet({
  open,
  onOpenChange,
  onSubmitReason,
  isPending,
}: RemoteReasonSheetProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RemoteReasonFormValues>({
    resolver: zodResolver(remoteReasonSchema),
    defaultValues: { reason: '' },
  })

  function handleDrawerOpenChange(next: boolean) {
    if (!next) reset({ reason: '' })
    onOpenChange(next)
  }

  function onSubmit(values: RemoteReasonFormValues) {
    onSubmitReason(values.reason)
  }

  return (
    <Drawer open={open} onOpenChange={handleDrawerOpenChange} title="ลงเวลานอกสถานที่">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 pt-2 pb-2">
        <p className="text-sm text-text-secondary">
          กรุณาระบุเหตุผลที่ไปทำงานนอกสถานที่ — ระบบจะบันทึกพิกัดปัจจุบันของคุณไว้ประกอบการลงเวลา
        </p>
        <Textarea
          label="เหตุผล"
          placeholder="เช่น ออกพบลูกค้า, ประชุมนอกสถานที่"
          error={errors.reason?.message}
          {...register('reason')}
        />
        <PrimaryButton
          type="submit"
          shape="pill"
          isPending={isPending}
          pendingText="กำลังลงเวลา..."
        >
          ยืนยันลงเวลา
        </PrimaryButton>
      </form>
    </Drawer>
  )
}
