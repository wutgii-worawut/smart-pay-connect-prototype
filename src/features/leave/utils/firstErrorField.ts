/**
 * features/leave/utils/firstErrorField.ts — เลือก field แรกที่มี error ตามลำดับที่ปรากฏบนจอฟอร์มสร้างใบลา
 * (auto-scroll to error field) แยกเป็น pure function (ไม่มี React) ตาม code-style.md §7 เพื่อเทสต์
 * เดี่ยวได้โดยไม่ต้อง render ฟอร์มจริง — ใช้เฉพาะตอน `onInvalid` ของ `handleSubmit`
 * (`handleInvalidSubmit` ใน `LeaveForm.tsx`) ส่วน `QUOTA_EXCEEDED` ที่ sync เข้า field `dateRange`
 * เรียก `setError('dateRange', ...)` + `scrollToSection` ตรง ๆ อยู่แล้ว (รู้ field อยู่แล้วจาก error
 * code) ไม่ผ่านฟังก์ชันนี้
 *
 * ลำดับอ้างอิงตำแหน่งบนจอ (บนสุด→ล่างสุด): ประเภทการลา (`type`) → ช่วงวันที่ลา (`dateRange`) →
 * เหตุผลการลา (`reason`) — เหตุผลที่ตัดวันแนบไฟล์/ผู้ปฏิบัติงานแทนออกจากลำดับนี้: field ที่ error ได้
 * จริงจาก schema (`leaveFormSchema.ts`) มีแค่ 3 ตัวนี้ (+ `root` ซึ่งไม่มี section ให้ scroll หา)
 */
const FIELD_ORDER = ['type', 'dateRange', 'reason'] as const

export type LeaveFormOrderedField = (typeof FIELD_ORDER)[number]

/** รับ `formState.errors` (หรือ object หน้าตาคล้ายกัน) มา คืน field แรกตามลำดับบนจอที่มี error
 *  ไม่มี error เลย → คืน `undefined` */
export function firstErrorField(
  errors: Partial<Record<LeaveFormOrderedField, unknown>>,
): LeaveFormOrderedField | undefined {
  return FIELD_ORDER.find((field) => errors[field] !== undefined)
}
