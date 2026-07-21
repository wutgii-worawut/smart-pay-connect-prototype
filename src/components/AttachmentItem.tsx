/**
 * components/AttachmentItem.tsx — แถวไฟล์แนบ ไอคอน+ชื่อไฟล์+ขนาด (S10, feature-plans/00 §1)
 * ใช้ในฟอร์มยื่นลา (แนบได้/ลบได้ผ่าน onRemove) และหน้า detail (อ่านอย่างเดียว หรือดูไฟล์ผ่าน onView)
 * ตัด/format ขนาดไฟล์เป็นหน้าที่ผู้เรียก (ไม่มี business logic ในนี้)
 */
interface AttachmentItemProps {
  fileName: string
  /** ข้อความขนาดไฟล์ที่ format มาแล้ว เช่น "ขนาด 120 KB" */
  fileSizeLabel: string
  /** แสดงปุ่มลบ (X) เมื่อส่งมา — ใช้ตอนกรอกฟอร์ม/ใบที่ยังแก้ไขได้ */
  onRemove?: () => void
  /** แสดงปุ่มดูไฟล์เมื่อส่งมาและไม่มี onRemove — ใช้ตอนอ่านอย่างเดียว */
  onView?: () => void
  className?: string
}

export function AttachmentItem({
  fileName,
  fileSizeLabel,
  onRemove,
  onView,
  className,
}: AttachmentItemProps) {
  return (
    <div
      className={['flex items-center gap-3 rounded-card bg-surface px-4 py-3', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-success"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v4h4" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary-dark">{fileName}</p>
        <p className="text-xs text-text-secondary">{fileSizeLabel}</p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="ลบไฟล์แนบ"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : onView ? (
        <button
          type="button"
          onClick={onView}
          aria-label="ดูไฟล์แนบ"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
