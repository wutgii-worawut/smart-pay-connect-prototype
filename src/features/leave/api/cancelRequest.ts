/**
 * features/leave/api/cancelRequest.ts — POST /leave/requests/{id}/cancel (§16.3, P15)
 * ไม่มี body (ยกเลิกใบของ id ที่ระบุใน path เท่านั้น — backend ใช้ตัวตนจาก JWT เช็คสิทธิ์เจ้าของ)
 *
 * 🔴 CONTRACT FLAG (P15): response shape หลังยกเลิกยังไม่ยืนยัน — endpoint จาก §16.3 ระบุแค่ path
 * ไม่ระบุ response ตัดสินใจไม่ parse response (แค่รู้ว่าสำเร็จ/ไม่สำเร็จผ่าน status code ก็พอ —
 * caller ยิง invalidate query แล้ว refetch รายละเอียดจริงต่อ ไม่ต้องพึ่ง shape ของ response นี้)
 */
import { api } from '@/lib/api-client'

export async function cancelRequest(id: string): Promise<void> {
  await api.post<unknown>(`/leave/requests/${id}/cancel`)
}
