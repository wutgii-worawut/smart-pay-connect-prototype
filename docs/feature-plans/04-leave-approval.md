# 04 — Leave Approval (ฝั่งหัวหน้า) — 7 หน้าจอ

> โฟลเดอร์: `features/approval/` | อ้างอิงเอกสารหลัก: 17 (role/สิทธิ์), 16.3 (API 🔒), 7.4 (atomic quota)
> เข้าถึงผ่าน SegmentedTabs "รออนุมัติลา" ใน shell เดียวกับ Leave — **เห็นเฉพาะ `role === 'manager'`** (ตัวกันจริง = backend 403)

## หน้าจอ

### 4.1 Pending List — `1.Pending List.png`
- โครง: SegmentedTabs (S1) → **`ManagerBanner`** (การ์ดน้ำเงิน: avatar อักษรย่อ + "หัวหน้า" + ชื่อ — feature component) → แท็บใน: **รออนุมัติ (n) | ประวัติการอนุมัติ** → `DropdownFilter` ปี/เดือน (S3) → รายการ `LeaveRequestCard` (จาก leave, `showEmployeeName=true`: ชื่อพนักงาน + ประเภท+จำนวนวัน + วันที่ + StatusBadge รออนุมัติ + "ตรวจสอบ ›")
- API: `GET /approval/pending` — badge เลขบน segment มาจาก count นี้ด้วย

### 4.2 Pending Details — `2.Pending Details.png`
- **`LeaveRequestDetailCard` mode `approver-action`**: หัว = ชื่อพนักงาน + "ส่งคำขอเมื่อ วันที่" + StatusBadge → TypeBanner → วันที่ลา / เหตุผล / **วันลาคงเหลือ (ของพนักงานคนนั้น)** / เอกสารแนบ (เปิดดูได้) / ผู้ปฏิบัติงานแทน / ผู้อนุมัติ → `Textarea` "ความเห็นผู้อนุมัติ (ถ้ามี)" → `BottomActionBar`: `DangerSoftButton` ไม่อนุมัติ | `PrimaryButton` อนุมัติ
- API: `GET /approval/requests/{id}`
- อนุมัติ: `POST .../approve {comment?}` — ตัดโควตา atomic ฝั่ง server (7.4)
- ไม่อนุมัติ: ต้องมีเหตุผล → ถ้าช่องความเห็นว่าง ให้ validate บังคับก่อนส่ง `POST .../reject {reason}`

### 4.3 Approve Success — `3.Approve - Success.png`
- กลับ list + `Toast` เขียว "อนุมัติคำขอลาแล้ว" + invalidate `pending`+`history` (badge ลด)

### 4.4 History — `4.History.png`
- โครงเดียวกับ 4.1 สลับแท็บใน → รายการที่เคยตัดสิน + StatusBadge อนุมัติแล้ว/ไม่อนุมัติ
- API: `GET /approval/history?year=&month=`

### 4.5 History Details (Approved) — `5.History Details - Approved.png`
- DetailCard mode `approver-view` (read-only) + `BottomActionBar`: ปิด | **`DangerSoftButton` "ยกเลิกคำขอ"**
- ⚠️ **ข้อค้นพบใหม่จาก design: หัวหน้า "ยกเลิก" ใบที่อนุมัติไปแล้วได้** (revoke) — contract ปัจจุบันยังไม่มี endpoint นี้ ต้องเพิ่ม `POST /approval/requests/{id}/revoke` + status ใหม่ (`REVOKED` หรือกลับเป็น `CANCELLED` โดย actor=manager) + **คืนโควตา** ให้พนักงาน + audit log — **เพิ่มเข้า Open Questions 23: เงื่อนไข revoke (ยกเลิกได้ถึงเมื่อไหร่? ก่อนวันลาเริ่ม?)**

### 4.6 History Details (Read Only, All Done) — `6.History Details - Read Only (All Done).png`
- เหมือน 4.5 แต่ action หมดสิทธิ์แล้ว (เช่น เลยวันลา/ถูกยกเลิกแล้ว) → มีแค่ปุ่ม ปิด — ใช้ prop `canRevoke` ควบคุม

### 4.7 Reject Success — `7.Reject - Success.png`
- กลับ list + `Toast` แดง "ไม่อนุมัติคำขอลาแล้ว"

## Components สรุป
- Shared/ยืมจาก leave: S1 S3 S4 S5 S7 S11 S12 S13 S14 S16 S18 + `LeaveRequestCard`, `LeaveRequestDetailCard` (compose ระดับ page ตามกฎเหล็กข้อ 1)
- Feature: `ManagerBanner`, `ApprovalTabs` (รออนุมัติ|ประวัติ + badge)

## กติกาสิทธิ์ (ย้ำจากเอกสารหลัก 17.3)
- เมนู/แท็บซ่อนตาม role = UX เท่านั้น — ทุก endpoint เช็ค `role=manager` + ใบเป็นของลูกทีม (`manager_id`) ไม่ผ่าน → `FORBIDDEN`
- ความขัดแย้งเวลาจริง: พนักงานยกเลิกพอดีตอนหัวหน้ากำลังกดอนุมัติ → server ตอบ `REQUEST_NOT_PENDING` → toast + refresh (เอกสารหลัก 16.2)

## โครงไฟล์ feature

```
features/approval/
├── api/          # getPending(), getRequest(), approve(), reject(),
│                 # getHistory(), revoke() (รอเคาะ endpoint)
├── components/   # ManagerBanner, ApprovalTabs
├── hooks/        # usePendingRequests(), useApprove(), useReject(), useApprovalHistory()
├── pages/        # ApprovalListPage, ApprovalDetailPage
└── index.ts
```
