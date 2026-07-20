---
description: Scaffold ส่วนใหม่ใน feature ตามโครงมาตรฐานของโปรเจกต์ (อ่าน feature plan ก่อนเสมอ)
argument-hint: <feature> <งานที่ต้องทำ เช่น "หน้า LeaveFormPage ตามแผน 3.6">
---
สร้าง/แก้โค้ดใน feature `$1` ตามงาน: $ARGUMENTS

**ก่อนเริ่ม — เช็ค argument:** ถ้าผู้ใช้ระบุมาแค่ชื่อ feature โดยไม่มีรายละเอียดงาน
(เช่นพิมพ์แค่ `/new-feature-page leave`) **ห้ามเดางานเอง** — ให้เปิด
`docs/feature-plans/` ของ feature นั้น เทียบกับโค้ดที่มีอยู่ใน `features/$1/`
แล้วสรุปเป็นตัวเลือกสั้น ๆ ว่า "หน้าจอ/ส่วนที่ยังไม่ได้ทำมีอะไรบ้าง แนะนำทำอันไหนก่อน"
เสนอให้ผู้ใช้เลือก แล้ว**รอคำตอบก่อนลงมือ**

ขั้นตอนบังคับ:
1. อ่าน `docs/feature-plans/` ไฟล์ของ feature `$1` — หา section ของหน้าจอ/งานที่ระบุ
2. อ่านตาราง shared components ใน `docs/feature-plans/00-shared-components.md`
   — ถ้า component ที่ต้องใช้มีใน S1-S18 หรือเป็นของร่วม (LeaveRequestCard/DetailCard)
   ให้ **ใช้ของเดิม** ห้ามสร้างซ้ำ; ถ้ายังไม่มีใครสร้าง ให้สร้างที่ตำแหน่งตามกฎ
   (รู้ business → ใน feature / UI ล้วน → src/components)
3. วางไฟล์ตามโครง `features/$1/{api,components,hooks,pages,types}` + export ผ่าน index.ts
4. เพิ่ม MSW handler ให้ endpoint ใหม่ + เทสต์ vitest สำหรับ utils ที่เพิ่ม
5. รัน lint → tsc → test → build ให้ผ่าน แล้วสรุปไฟล์ที่แตะ

มอบงาน implementation ให้ subagent `worker` ได้ ถ้างานตรงไปตรงมา