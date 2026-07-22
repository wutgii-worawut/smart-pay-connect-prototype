/**
 * features/approval/utils/initials.ts — สรุปชื่อเต็มเป็นตัวย่อ 2 ตัวอักษร สำหรับ avatar วงกลมใน
 * `ManagerBanner` (P19, จอ `1.Pending List.png`) — pure function ล้วน (testing.md ข้อบังคับ)
 *
 * กติกา (deterministic ง่าย ๆ ตามที่ตกลง — ดู task brief P19):
 * - ≥2 คำ (คั่นด้วยช่องว่าง) → อักษรตัวแรกของคำแรก + อักษรตัวแรกของคำที่สอง
 * - 1 คำ → 2 ตัวอักษรแรกของคำนั้น
 * - ว่าง/ช่องว่างล้วน → คืนสตริงว่าง
 *
 * ⚠️ approximate เท่านั้น: design `1.Pending List.png` โชว์ "วช" สำหรับ "วิชัย มั่นคง" (ดูเหมือนตัด
 * เฉพาะพยัญชนะตัวแรก+สอง ของคำแรก โดยข้ามสระ/วรรณยุกต์ "ิ"/"ั" — เป็นกติกาเฉพาะฟอนต์ไทยที่ทำแบบ
 * deterministic ยากมากสำหรับสตริงทั่วไป) กฎด้านบนจะได้ "วม" ไม่ตรงกับรูปเป๊ะ — ยอมรับความคลาดเคลื่อนนี้
 * (Figma-only, ไม่ใช่กติกาธุรกิจ) ตามที่ task brief ระบุไว้ล่วงหน้า
 */
export function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2)
  }
  return words[0].slice(0, 1) + words[1].slice(0, 1)
}
