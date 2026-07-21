/**
 * features/auth/types/auth.ts — primitive ของ auth feature (session/response shapes, §17.2)
 */

/**
 * role มาจาก response `POST /auth/login` (`employee.role`) เท่านั้น — **ห้ามใช้
 * `liff.getProfile()`/`liff.getDecodedIDToken()` ตัดสิน role หรือ authorize สิ่งใด** (§14
 * "ห้ามเชื่อค่าใด ๆ จาก frontend"); backend เป็นคนตัดสิน role จริงจาก JWT payload ที่ฝังไว้ (§17.2)
 * เราแค่สะท้อนค่าที่ backend ยืนยันแล้วมาใช้ทำ UI gating (§17.3 — ตัวกันจริงคือ backend 403)
 */
export type EmployeeRole = 'employee' | 'manager'

export interface Employee {
  id: string
  name: string
  role: EmployeeRole
}
