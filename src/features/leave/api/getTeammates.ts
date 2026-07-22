/**
 * features/leave/api/getTeammates.ts — GET /employees/teammates (P16, feature-plans/03 §3.6)
 *
 * 🔴 CONTRACT FLAG (§23 landmine ข้อ 2): endpoint invented ทั้งหมด ไม่มีในสัญญา §16.3 — รวม
 * `approverName` (ผู้อนุมัติ auto จาก manager_id ของพนักงาน, จอ 6.1/6.2 ช่อง "ผู้อนุมัติ" ที่ผู้ใช้
 * เลือกเองไม่ได้) ไว้ใน response เดียวกัน แทนที่จะแยกยิง `GET /leave/form-config` อีก endpoint ที่ไม่มี
 * สัญญาเช่นกัน — ลดจำนวน endpoint สมมติ รอ backend/swagger ยืนยันทั้งชุด (ทั้ง shape และว่าจะแยก
 * endpoint จริงหรือไม่)
 */
import { z } from 'zod'
import { api } from '@/lib/api-client'
import type { Teammate } from '@/types/leave'

export interface TeammatesResult {
  teammates: Teammate[]
  approverName: string
}

const teammatesResultSchema = z.object({
  teammates: z.array(z.object({ id: z.string(), name: z.string() })),
  approverName: z.string(),
})

export async function getTeammates(): Promise<TeammatesResult> {
  const data = await api.get<unknown>('/employees/teammates')
  return teammatesResultSchema.parse(data)
}
