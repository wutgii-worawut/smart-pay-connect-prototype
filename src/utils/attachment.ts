/**
 * src/utils/attachment.ts — ตรวจสอบชนิดไฟล์แนบ + format ขนาดไฟล์ (P16, feature-plans/03 §3.6)
 * pure function ล้วน ไม่มี React/network — ใช้กับ `AttachmentDropzone` (ฟอร์มสร้างใบลา จอ 6.1/6.2 §4)
 */

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']

/** เช็คนามสกุลไฟล์จากชื่อไฟล์ (case-insensitive) — รองรับแค่ PDF/JPG/PNG ตาม design 6.1/6.2 */
export function isAllowedAttachmentFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext !== undefined && ALLOWED_EXTENSIONS.includes(ext)
}

/**
 * format ขนาดไฟล์เป็น label พร้อมแสดง (ปัดเศษ ไม่มีทศนิยมช่วง B/KB, ทศนิยม 1 ตำแหน่งช่วง MB)
 * เช่น formatFileSize(500) -> "500 B", formatFileSize(122880) -> "120 KB",
 * formatFileSize(1572864) -> "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}
