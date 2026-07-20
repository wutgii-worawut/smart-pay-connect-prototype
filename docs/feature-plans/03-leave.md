# 03 — Leave (ระบบลา ฝั่งพนักงาน) — 9 หน้าจอ

> โฟลเดอร์: `features/leave/` | อ้างอิงเอกสารหลัก: 3.2 (ยกเลิกใบลา), 7 (แยก logic), 16.3 (API), 4.2 (วันที่เป็น string)
> Rich Menu → `/leave` | ใช้ shell ร่วมกับ Approval (SegmentedTabs บนสุด: **การลาของฉัน | รออนุมัติลา** — แท็บขวาเห็นเฉพาะ manager)

## หน้าจอ

### 3.1 Balance — `1.Balance.png`
- ส่วนบนของหน้า "การลาของฉัน": การ์ดโควตาต่อประเภท (พักร้อน/ป่วย/กิจ) ใช้แล้ว/คงเหลือ
- Components: `LeaveBalanceCard` (feature) ×3 ใช้ `LeaveTypeIcon` (S5)
- API: `GET /leave/balance` — label "คงเหลือ (โดยประมาณ)" ตามเอกสารหลัก 7.4
- ปุ่มลอย/ปุ่มหลัก "ยื่นลา" → ไปฟอร์ม 3.6

### 3.2 รายการรออนุมัติของฉัน — `2.Pending Requests.png`
- แท็บล่างสลับ **ประวัติการลาของฉัน | รออนุมัติลา (n)** + `FilterChips` ประเภท (S2) + `DropdownFilter` ปี/เดือน/สถานะ (S3)
- รายการ = `LeaveRequestCard` (ร่วมกับ Approval — ดู 00 §2) + `StatusBadge` (S4)
- API: `GET /leave/requests?status=PENDING`

### 3.3 History — `3.History.png`
- โครงเดียวกับ 3.2 ต่าง status filter → **หน้าเดียวกัน เปลี่ยน query** ไม่ใช่หน้าใหม่
- API: `GET /leave/requests?status=&year=&month=`

### 3.4 History Details (read-only) — `4.History Details.png`
- ใช้ **`LeaveRequestDetailCard` mode `owner-view`** (ดู 00 §2) + `BottomActionBar` (S14): ปุ่ม ปิด
- API: `GET /leave/requests/{id}`

### 3.5 History Details (Editable) — `5.History Details - Editable.png`
- ใบที่ยังแก้ได้ (PENDING): DetailCard เดิม + ปุ่มแก้ไข/ยกเลิก
- ⚠️ **"แก้ไขใบลา" เป็น flow ที่ contract ยังไม่มี endpoint** (`PUT /leave/requests/{id}`?) — ต้องเคาะ: แก้ได้จริง หรือให้ยกเลิกแล้วยื่นใหม่? (เพิ่มเข้า Open Questions 23)

### 3.6 Create Request — `6.Create Request.png` (หน้าที่หนักสุดของ feature)
- ฟอร์ม: เลือกประเภทลา → `DateRangeField` (S16 — เปิด shadcn Calendar range) → toggle เต็มวัน/ครึ่งวัน → แสดง "จำนวนวันที่ลา" (คำนวณจาก `countLeaveDays` — เอกสารหลัก 4.1 หักวันหยุดด้วย) + "วันลาคงเหลือ (โดยประมาณ)" → เหตุผล `Textarea` → แนบไฟล์ `AttachmentItem` (S10) → **ผู้ปฏิบัติงานแทน** (Select รายชื่อเพื่อนร่วมทีม) → ผู้อนุมัติ (แสดงอัตโนมัติจาก manager_id) → ปุ่มส่งคำขอ
- ⚠️ **"ผู้ปฏิบัติงานแทน" ต้องมี endpoint รายชื่อเพื่อนร่วมทีม** — contract ยังไม่มี → เพิ่ม `GET /employees/teammates` (Open Questions/contract update)
- RHF + Zod ทั้งฟอร์ม; multipart upload; วันที่ส่งเป็น `YYYY-MM-DD` string (กติกา 4.2)
- Error: `QUOTA_EXCEEDED` โชว์ตรงช่องวันที่, `VALIDATION_ERROR` ต่อ field

### 3.7 Create Success — `7.Create Request - Success.png`
- `SuccessScreen` (S17) → กลับรายการ + invalidate `balance` + `requests`

### 3.8 Sended Pending Details — `8. Sended Pending Details.png`
- DetailCard mode `owner-view` + `DangerSoftButton` **ยกเลิกคำขอ** (S12)
- กดยกเลิก → confirm (Drawer) → `POST /leave/requests/{id}/cancel`

### 3.9 Cancel Success — `9. Sended Cancel Pending Request.png`
- กลับหน้ารายการ + `Toast` (S7) แดง "ยกเลิกคำขอแล้ว" + ใบนั้นหายจาก pending (invalidate ทั้งฝั่งเราและฝั่งหัวหน้าเห็นผลตอน refetch)

## Components สรุป
- Shared: S2 S3 S4 S5 S7 S10 S12 S13 S14 S16 S17 S18 + `LeaveRequestCard`, `LeaveRequestDetailCard` (นิยามที่ feature นี้ — approval มาใช้ต่อ)
- Feature: `LeaveBalanceCard`, `LeaveForm`, `CancelConfirmSheet`

## โครงไฟล์ feature

```
features/leave/
├── api/          # getBalance(), getRequests(), getRequest(), create(), cancel()
├── components/   # LeaveBalanceCard, LeaveForm, LeaveRequestCard,
│                 # LeaveRequestDetailCard, CancelConfirmSheet
├── hooks/        # useLeaveBalance(), useLeaveRequests(), useSubmitLeave(), useCancelLeave()
├── utils/        # leave-days.ts (countLeaveDays — เทสต์ภาคบังคับ 21.2)
├── pages/        # LeaveShellPage (segmented + สลับ list/approval),
│                 # LeaveFormPage, LeaveDetailPage, LeaveSuccessPage
└── index.ts
```

## คำถามค้างที่เกิดจาก design กลุ่มนี้
1. ใบลา PENDING **แก้ไข**ได้จริงไหม (จอ 3.5) หรือใช้ยกเลิก+ยื่นใหม่ → กำหนด endpoint
2. รายชื่อ "ผู้ปฏิบัติงานแทน" มาจากไหน (ทีมเดียวกัน? เลือกใครก็ได้?) → endpoint teammates
3. ครึ่งวัน (เช้า/บ่าย) นับโควตา 0.5 วัน — ตรวจว่า `countLeaveDays` และ backend รองรับทศนิยม
