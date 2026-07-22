/**
 * features/leave/components/AttachmentDropzone.tsx — "แตะเพื่อแนบไฟล์" (จอ 6.1/6.2 §4, P16)
 * เก็บ `File[]` ตรง ๆ ใน RHF form state (`Controller`, ไม่ใช่ native input — ไม่ upload จริงตอนเลือก
 * ไฟล์ ดู CONTRACT FLAG multipart ที่ `api/createLeave.ts`) ลบได้ในฟอร์มนี้เท่านั้น (ต่างจาก P15
 * detail ที่อ่านอย่างเดียว — allowed ตาม spec P16) รับ/แสดงได้หลายไฟล์
 */
import { useRef } from 'react'
import { AttachmentItem } from '@/components/AttachmentItem'
import { formatFileSize, isAllowedAttachmentFile } from '@/utils/attachment'

interface AttachmentDropzoneProps {
  files: File[]
  onChange: (files: File[]) => void
}

function PlusCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function AttachmentDropzone({ files, onChange }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePick() {
    inputRef.current?.click()
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return
    const picked = Array.from(fileList).filter((file) => isAllowedAttachmentFile(file.name))
    if (picked.length > 0) onChange([...files, ...picked])
    // เคลียร์ input เสมอ (แม้เลือกไฟล์ชื่อ/ประเภทเดิมซ้ำ change event ยังยิงได้)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <button
        type="button"
        onClick={handlePick}
        className="flex w-full flex-col items-center gap-2 rounded-card border border-dashed border-primary/20 bg-white px-4 py-8 text-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
          <PlusCircleIcon />
        </span>
        <span className="text-sm font-semibold text-success">แตะเพื่อแนบไฟล์</span>
        <span className="text-xs text-text-secondary">PDF · JPG · PNG</span>
      </button>

      {files.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((file, index) => (
            <AttachmentItem
              key={`${file.name}-${index}`}
              fileName={file.name}
              fileSizeLabel={formatFileSize(file.size)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
