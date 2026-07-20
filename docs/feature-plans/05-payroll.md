# 05 — Payroll (สลิปเงินเดือน) — 3 หน้าจอ

> โฟลเดอร์: `features/payroll/` | อ้างอิงเอกสารหลัก: 3.3 (email), 14 (สิทธิ์), 16.3 (API)
> Rich Menu → `/payroll` | **read-only ทั้ง feature + เข้มเรื่องสิทธิ์ที่สุด** (เห็นเฉพาะของตัวเอง, audit ทุกการเปิดดู)

## หน้าจอ

### 5.1 Payslip History — `1.Payslip History.png`
- โครง: `ProfileBar` (S15) → `DropdownFilter` ปี (S3) → รายการเดือนด้วย `ListCard` (S6): "เงินเดือน มิถุนายน 2569" + รับสุทธิ + งวด + "ตรวจสอบ ›"
- API: `GET /payroll/payslips?year=`
- เดือน format ไทย + พ.ศ. ผ่าน `formatThaiDate` helper (เอกสารหลัก 4.1)

### 5.2 Payslip Details — `2.Payslip Details.png`
- โครง: หัว "เงินเดือน มิถุนายน 2569" + icon ✉️ มุมขวา → **`PayslipSummaryHero`** (feature): "รับสุทธิ" + ตัวเลขใหญ่ 28,560 บาท + chip "เงินเดือนออก 30 มิ.ย. 2569 งวดที่ 1" → การ์ด section: **พนักงาน** (รหัส/ชื่อ/ตำแหน่ง/หน่วยงาน/วันเข้างาน — `DetailField` S8) → **รายรับ** (เงินเดือนพื้นฐาน, ค่าล่วงเวลา, ...) → **รายหัก** (ประกันสังคม, ภาษี, ...) → `BottomActionBar` (S14): `GhostButton` ส่งเข้าอีเมล ✉️ | ปิด
- API: `GET /payroll/payslips/{id}` — backend เขียน audit `PAYSLIP_VIEW`
- ตัวเลขเงิน format ผ่าน helper กลาง (`formatBaht`) — ห้าม format เองกระจัดกระจาย

### 5.3 Email Success — `3.Email Payslip - Success.png`
- หน้าเดิม + `Toast` (S7) เขียว "ส่งอีเมลแล้ว"
- API: `POST /payroll/payslips/{id}/email` — **ไม่มี input อีเมลใน design ✔** ตรงกับกติกา 3.3 (ส่งไปอีเมลที่ลงทะเบียนเท่านั้น) — ปุ่มควร disabled ระหว่างส่ง + กันกดรัว (mutation retry:0 — เอกสารหลัก 20.4)

## Components: Shared S3 S6 S7 S8 S13 S14 S15 S18 | Feature: `PayslipSummaryHero`, `PayslipSection` (การ์ดหัวข้อ+รายการ DetailField), `PayslipCard`

## โครงไฟล์

```
features/payroll/
├── api/          # getPayslips(), getPayslip(), emailPayslip()
├── components/   # PayslipCard, PayslipSummaryHero, PayslipSection
├── hooks/        # usePayslips(), usePayslip(), useEmailPayslip()
├── pages/        # PayslipListPage, PayslipDetailPage
└── index.ts
```

## หมายเหตุ: โครงสร้างรายรับ/รายหักควรมาจาก API เป็น array `{label, amount}` ไม่ hardcode ชื่อรายการ — ระบบเดิมเป็นผู้กำหนดรายการ
