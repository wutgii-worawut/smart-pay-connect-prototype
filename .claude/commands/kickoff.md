---
description: เริ่มโปรเจกต์ — ให้ consultant สำรวจ repo + docs ทั้งหมด แล้วสร้าง plan/plan.md และ plan/progress.md แบ่งงานเป็นเฟสสำหรับทำหลาย session
---
คุณคือ main agent ทำตามลำดับนี้ ห้ามข้ามขั้น:

## ขั้นที่ 1 — ส่ง consultant ไปสำรวจ (subagent `consultant`, read-only)

มอบหมายให้ consultant:
- สำรวจโครง repo ปัจจุบัน (มีอะไรแล้ว/ยังไม่มีอะไร)
- อ่าน `CLAUDE.md`, `.claude/rules/*`, `docs/architecture.md` (ทั้ง 23 หัวข้อ โดยเฉพาะ
  §22 แผนลงมือทำ และ §23 Open Questions), `docs/feature-plans/*.md` ทุกไฟล์
  และสุ่มเปิดรูป `docs/design/SME-PAYROLL/` ประกอบ
- เสนอ **แผนแบ่งเฟส** กลับมา โดยยึดหลัก:
  - **แบ่งเผื่อ**: แต่ละเฟสเล็กพอที่จะจบได้ใน 1 session แน่นอน (เหตุผล: context เต็มได้ +
    model usage limit) — session ที่ลื่นอาจทำได้หลายเฟสต่อกัน ซึ่งดี แต่ห้ามมีเฟสใหญ่จนล้น session
    → ขนาดประมาณ "1 เฟส = 1 feature ย่อย หรือ 1 ชุด shared components" ไม่ใหญ่กว่านั้น
  - เรียงตาม dependency: setup/tokens → shared components (S1-S18 + ของร่วม) →
    auth → attendance → leave+calendar → approval → payroll → hardening/checklist
  - ทุกเฟสระบุ: เป้าหมาย, ไฟล์/โฟลเดอร์ที่จะแตะ, อิง feature plan ไฟล์ไหน section ไหน,
    Definition of Done (lint + tsc + test + build ผ่าน + เช็คกับรูป design),
    และสิ่งที่ต้องระวังจาก Open Questions (§23) ที่ห้าม implement เอง

## ขั้นที่ 2 — main agent เขียนไฟล์ (consultant เขียนไฟล์ไม่ได้)

สร้างโฟลเดอร์ `plan/` แล้วเขียน 2 ไฟล์จากข้อเสนอของ consultant:

**`plan/plan.md`** — แผนเต็ม: ตารางเฟสทั้งหมด + รายละเอียดต่อเฟสตามขั้นที่ 1

**`plan/progress.md`** — ใช้โครงนี้เป๊ะ (สำคัญมาก ทุก session ใหม่เริ่มอ่านไฟล์นี้):

```markdown
# Progress — HR LIFF App

## 1. สำหรับ session ใหม่: เริ่มตรงนี้ก่อน

### 1.1 สถานะปัจจุบัน
(อัปเดตทุกครั้งที่จบงาน — เฟสไหนเสร็จ, ค้างอะไร, branch/commit ล่าสุด)

### 1.2 งานถัดไป
(เฟสถัดไปคืออะไร + link ไป section ใน plan.md)

### 1.3 session ใหม่ทำแบบนี้
1. อ่านไฟล์นี้ทั้งไฟล์ + "บันทึกแก้แผน" ท้ายไฟล์
2. อ่าน plan.md เฉพาะเฟสที่จะทำ + feature plan ที่เฟสอ้าง
3. ยืนยันกับผู้ใช้ว่าจะทำเฟสนี้ แล้วเริ่มตามวิธีทำงานข้อ 1.4

### 1.4 วิธีทำงานของโปรเจกต์นี้
1. แต่ละเฟสแบ่งเป็น 3 บทบาท ผ่าน subagent (นิยามใน `.claude/agents/`):
   - `worker` — ลงมือ implement ตาม plan.md ทีละเฟส
   - `consultant` (read-only) — รีวิวหลัง worker เสร็จ ก่อนไปต่อ
   - main agent — verify `npm run lint` + `npm run build` เอง, อัปเดตไฟล์นี้, สรุปให้ผู้ใช้
2. หยุดรอผู้ใช้เคาะทุกจบเฟส — ผู้ใช้ต้องการดูสรุป + รีวิวก่อนสั่งเฟสถัดไปเสมอ ห้ามข้ามเฟสเอง
3. follow-up จาก consultant แก้ก่อนไปเฟสถัดไป (worker แก้ → main agent verify → สรุป → รอเคาะ)
4. อ่าน "บันทึกแก้แผน" (ท้ายไฟล์นี้) ก่อนลงมือทุกครั้ง — เก็บกับดักของ prototype
   + สิ่งที่ consultant ดักไว้

## 2. งานแต่ละเฟส
(รายการเฟสจาก plan.md — mark สถานะ: ⬜ ยังไม่เริ่ม / 🔄 กำลังทำ / 🔍 รอรีวิว / ✅ เสร็จ+ผู้ใช้เคาะแล้ว)

| เฟส | ชื่อ | สถานะ | หมายเหตุ |
|---|---|---|---|

## บันทึกแก้แผน
(append-only — วันที่ + สิ่งที่เปลี่ยนจาก plan.md + เหตุผล + กับดักที่เจอ)
```

## ขั้นที่ 3 — สรุปให้ผู้ใช้แล้วหยุด

แสดงตารางเฟสทั้งหมด + ขอให้ผู้ใช้รีวิว/เคาะแผน **ห้ามเริ่ม implement เฟสแรกเองจนกว่าผู้ใช้สั่ง**
