/**
 * features/approval/api/reject.ts — POST /approval/requests/{id}/reject (§16.3, P20, จอ
 * `2.Pending Details.png` ปุ่ม "ไม่อนุมัติ" → `7.Reject - Success.png`)
 * `reason` **บังคับ** — `ApprovalDetailPage` validate ช่องความเห็นว่างก่อนเรียก mutation นี้เสมอ
 * (ไม่ปล่อยให้ backend เป็นคนเช็คอย่างเดียว — ให้ผู้ใช้เห็น error ทันทีที่ฟอร์ม)
 *
 * 🔴 CONTRACT FLAG (P20): response shape หลังไม่อนุมัติยังไม่ยืนยัน — เหมือนสถานการณ์เดียวกับ `approve.ts`
 * ไม่ parse response
 */
import { api } from '@/lib/api-client'

export async function rejectRequest(id: string, reason: string): Promise<void> {
  await api.post<unknown>(`/approval/requests/${id}/reject`, { reason })
}
