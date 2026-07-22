# 03 — Leave (ระบบลา ฝั่งพนักงาน) — 9 หน้าจอ

> โฟลเดอร์: `features/leave/` | อ้างอิงเอกสารหลัก: 3.2 (ยกเลิกใบลา), 7 (แยก logic), 16.3 (API), 4.2 (วันที่เป็น string)
> Rich Menu → `/leave` | **ฝั่งพนักงาน:** แถบล่าง SegmentedTabs **"ประวัติการลาของฉัน | ใบลารออนุมัติ(n)"** (ใบของตัวเอง) + balance เป็น view เริ่มต้น (P14, ตาม PNG ชุด `3.Leave`). **แท็บบนสุด "การลาของฉัน | รออนุมัติ(n)" = จอ manager เท่านั้น** (`4.Leave Approval/1.Pending List.png`) — ทำตอน P19 โดย **compose ที่ระดับ `app/`** (กฎเหล็ก §6 ห้าม leave import approval); design มี 2 persona ซ้อนกัน อย่าอ่านรวบเป็นแท็บเดียว

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

### 3.6 Create Request — `6.1.Create Request (1 day).png` (วันเดียว) / `6.2.Create Request (more 1 days).png` (หลายวัน) (หน้าที่หนักสุดของ feature)
- ฟอร์ม: เลือกประเภทลา → `DateRangeField` (S16 — วันที่เริ่ม/ถึงวันที่) → **ช่วงเวลา (period รายวัน):**
  - **วันเดียว** (start===end, จอ 6.1): toggle เดียว **เต็มวัน / เช้า / บ่าย**
  - **หลายวัน** (จอ 6.2): render **แถวต่อวัน** จาก `listLeaveWorkingDays(start, end, holidays)` — แต่ละแถว = วันที่ + toggle เต็มวัน/เช้า/บ่าย; **วันเสาร์อาทิตย์/วันหยุดในช่วง = แถว disabled label "วันหยุด" ไม่มี toggle และไม่นับ**; แถวรายวันต้องแสดง**ครบทุกวันทำงานรวมวันเริ่ม** (Figma ตัวอย่างตกวันเริ่มไป — ยึดกติกาวันทำงาน 4.1)
  - "รวมจำนวนวันลา" = `sumLeaveDays(days)` (full=1, am/pm=0.5 → จอ 6.2 = 2.5) + "วันลาคงเหลือ (โดยประมาณ)"
  - → เหตุผล `Textarea` → แนบไฟล์ `AttachmentItem` (S10) → **ผู้ปฏิบัติงานแทน** (Select) → ผู้อนุมัติ (auto จาก manager_id) → ปุ่มส่งคำขอ
- **Contract:** `POST /leave/requests` body `days:[{date, period}]` — วันเดียวก็ `days` ยาว 1 (shape เดียว). Zod ฝั่งฟอร์ม = ด่านเข้ม (days ครบทุกวันทำงานในช่วง); backend เช็คระดับรายการ (ดู architecture §16.3)
- ⚠️ **"ผู้ปฏิบัติงานแทน" ต้องมี endpoint รายชื่อเพื่อนร่วมทีม** — contract ยังไม่มี → เพิ่ม `GET /employees/teammates` (Open Questions/contract update)
- 🔮 **ฟีเจอร์อนาคต (ห้ามทำดักไว้):** "ลบวันรายแถว" ออกจากฟอร์มหลายวัน — โครง `days[]` รองรับแล้ว รอนโยบาย + design ยืนยันก่อน
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
├── utils/        # (day-count utils เป็น shared: src/utils/date.ts — listLeaveWorkingDays + sumLeaveDays, เทสต์ภาคบังคับ 21.2)
├── pages/        # LeaveShellPage (balance + สลับ pending/history ของตัวเองผ่านแถบล่าง —
│                 #   ฝั่ง approval ของ manager compose ที่ app/ ตอน P19 ไม่อยู่ในไฟล์นี้),
│                 # LeaveFormPage, LeaveDetailPage, LeaveSuccessPage
└── index.ts
```

## คำถามค้างที่เกิดจาก design กลุ่มนี้
1. ใบลา PENDING **แก้ไข**ได้จริงไหม (จอ 3.5) หรือใช้ยกเลิก+ยื่นใหม่ → กำหนด endpoint
2. รายชื่อ "ผู้ปฏิบัติงานแทน" มาจากไหน (ทีมเดียวกัน? เลือกใครก็ได้?) → endpoint teammates
3. ~~ครึ่งวัน (เช้า/บ่าย) นับโควตา 0.5 วัน~~ ✅ **เคาะแล้ว 2026-07-21:** ใช้ period รายวัน (`days:[{date,period}]`) — `sumLeaveDays` full=1/am/pm=0.5, backend รองรับทศนิยม (ดู §3.6 + architecture §4.1/§16.3)
