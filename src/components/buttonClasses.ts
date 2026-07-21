/**
 * components/buttonClasses.ts — class string กลางสำหรับปุ่ม S11-S13 (feature-plans/00 §1)
 * ป้องกัน class ซ้ำเกิน 2-3 ที่ตาม code-style.md (Styling) — สี/มุมโค้งมาจาก token ใน @theme เท่านั้น
 * (มุมโค้ง --radius-card ตามที่ระบุ — ปุ่ม/การ์ด/ช่องกรอกใช้ token เดียวกันทั้งแอป ตาม architecture §9.3)
 *
 * design มีปุ่ม 2 ทรง: 'card' (มุมโค้ง --radius-card เดิม — จอ Registration/Success/ช่องกรอก)
 * กับ 'pill' (มุมโค้งเต็ม — คู่ปุ่มใน BottomActionBar) — ควบคุมผ่าน prop `shape` เท่านั้น
 * `rounded-full` เป็นค่าคงที่เชิงเรขาคณิต (มุมกลมสุดเสมอไม่ว่าปุ่มสูงเท่าไร) ไม่ใช่ค่าที่มาจาก
 * design token จึงไม่ต้องเพิ่ม token ใหม่ใน @theme
 */
export type ButtonShape = 'card' | 'pill'

const BASE =
  'inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-base font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function shapeClass(shape: ButtonShape): string {
  return shape === 'pill' ? 'rounded-full' : 'rounded-card'
}

/** S11 — ปุ่มหลัก (ลงทะเบียน/อนุมัติ/ส่งคำขอ) */
export function primaryButtonClass(shape: ButtonShape = 'card'): string {
  return `${BASE} ${shapeClass(shape)} bg-primary text-white`
}

/** S12 — ปุ่มรองเชิงลบ (ไม่อนุมัติ/ยกเลิกคำขอ) พื้นแดงอ่อน */
export function dangerSoftButtonClass(shape: ButtonShape = 'card'): string {
  return `${BASE} ${shapeClass(shape)} bg-danger/10 text-danger`
}

/** S13 — ปุ่มรอง/ทางเลือก (ปิด/ThaID/นำทางกลับ) ขาวขอบบาง */
export function ghostButtonClass(shape: ButtonShape = 'card'): string {
  return `${BASE} ${shapeClass(shape)} border border-primary/20 bg-white text-primary-dark`
}
