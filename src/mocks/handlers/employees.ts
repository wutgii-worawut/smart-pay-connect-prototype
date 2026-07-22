/**
 * MSW handler — `GET /employees/teammates` (P16, feature-plans/03 §3.6)
 *
 * 🔴 CONTRACT FLAG (§23 landmine ข้อ 2): endpoint invented ทั้งหมด ไม่มีในสัญญา §16.3 — สมมติ scope
 * "ทีมเดียวกัน" (team-scoped, 3-4 คน) เท่านั้น — ห้ามสมมติว่าเป็นรายชื่อทั้งบริษัท รวม `approverName`
 * (ผู้อนุมัติ auto จาก manager_id) ไว้ใน response เดียวกัน กันต้องเพิ่ม endpoint
 * `GET /leave/form-config` อีกตัวที่ไม่มีสัญญาเช่นกัน — ชื่อ "นายวิชัย มั่นคง" อิงจาก design
 * `6.1/6.2.Create Request.png` ตรง ๆ (ต่างเล็กน้อยจาก `PENDING_DETAIL.approverName` = "คุณวิชัย
 * มั่นคง" ใน `leave.ts` — คำนำหน้าไม่ตรงกันข้ามชุด mock เป็นข้อมูลสมมติทั้งคู่คนละจุด ไม่กระทบ logic)
 * ชื่อ teammate แรก "นายแทนคุณ สมมุติ" ใช้ id `teammate-1` ให้ตรงกับ `PENDING_DETAIL.proxyName` ใน
 * `leave.ts` เพื่อความต่อเนื่องของข้อมูลตัวอย่างข้ามจอ
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export const employeesHandlers = [
  http.get(`${BASE_URL}/employees/teammates`, () => {
    return HttpResponse.json({
      data: {
        teammates: [
          { id: 'teammate-1', name: 'นายแทนคุณ สมมุติ' },
          { id: 'teammate-2', name: 'นางสาวสมหญิง ใจดี' },
          { id: 'teammate-3', name: 'นายประเสริฐ ตั้งใจ' },
          { id: 'teammate-4', name: 'นางสาววรรณา สุขสันต์' },
        ],
        approverName: 'นายวิชัย มั่นคง',
      },
    })
  }),
]
