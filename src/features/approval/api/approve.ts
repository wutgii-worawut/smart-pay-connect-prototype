/**
 * features/approval/api/approve.ts — POST /approval/requests/{id}/approve (§16.3, P20, จอ
 * `2.Pending Details.png` ปุ่ม "อนุมัติ" → `3.Approve - Success.png`)
 * ตัดโควตา atomic ฝั่ง server เท่านั้น (§7.4) — frontend แค่ส่ง comment ที่ผู้อนุมัติกรอก (ไม่บังคับ)
 *
 * `comment` ไม่บังคับ (design ระบุ "ความเห็นผู้อนุมัติ (ถ้ามี)") — omit key ทั้งอันถ้าว่าง ไม่ส่ง
 * `comment: undefined`/`''` (มิเรอร์วิธี `substituteId?` ที่ `api/createLeave.ts`, P16)
 *
 * 🔴 CONTRACT FLAG (P20): response shape หลังอนุมัติยังไม่ยืนยัน — endpoint จาก §16.3 ระบุแค่ path ไม่
 * ระบุ response ตัดสินใจไม่ parse response (แค่รู้ว่าสำเร็จ/ไม่สำเร็จผ่าน status code ก็พอ — caller ยิง
 * invalidate query แล้ว navigate กลับ list ไม่ต้องพึ่ง shape ของ response นี้ เหมือน `cancelRequest.ts` P15)
 */
import { api } from '@/lib/api-client'

export async function approveRequest(id: string, comment?: string): Promise<void> {
  const body = comment ? { comment } : {}
  await api.post<unknown>(`/approval/requests/${id}/approve`, body)
}
