# 01 — Registration (auth feature) — 4 หน้าจอ

> โฟลเดอร์: `features/auth/` | อ้างอิงเอกสารหลัก: 13.2 (register ครั้งเดียว), 3.4 (OTP), 16.3 (API)
> เข้าหน้านี้เมื่อ `POST /auth/login` ตอบ `NEED_REGISTER` เท่านั้น — ผูกสำเร็จแล้วไม่เห็นอีก

## หน้าจอ

### 1.1 ฟอร์มลงทะเบียน — `1.LINEOA-Registration.png`
- Route: `/register`
- โครง: พื้นหลัง gradient ฟ้า + โลโก้ SmartPay Connect → หัวข้อ "ลงทะเบียนผู้ใช้งาน" → ช่องกรอก 2 ช่อง → ปุ่มลงทะเบียน → divider "หรือ" → ปุ่ม ThaID
- Components: `TextInput` ×2 (S16 — เลขบัตร ปชช. ใส่ mask `1-2345-67890-12-3`, อีเมลองค์กร), `PrimaryButton` (S11), ปุ่ม ThaID = `GhostButton` (S13) + โลโก้ + icon ℹ️
- Validation (Zod): เลขบัตร 13 หลัก + checksum, อีเมลลงท้าย domain องค์กร (ใน design บังคับ `@ap.go.th` — **ยืนยัน domain จริงกับทีม**)
- API: `POST /auth/register/request-otp` `{citizenId, email}` → สำเร็จไปหน้า OTP
- Error: `VALIDATION_ERROR` โชว์ใต้ช่อง, ไม่พบพนักงาน → ข้อความ "ไม่พบข้อมูล ติดต่อ HR", `OTP_RATE_LIMITED` → บอกเวลารอ

### 1.2 Digital ID Only — `1.LINEOA-Registration-Digital ID Only.png`
- หน้าเดียวกับ 1.1 แต่**ตัดฟอร์มออก เหลือปุ่ม ThaID อย่างเดียว** → เป็น "config mode" ของหน้าเดียวกัน ไม่ใช่หน้าใหม่
- ทำเป็น flag `VITE_REGISTER_MODE = 'form+thaid' | 'thaid-only'` (หรือ config จาก API)
- ⚠️ **ThaID integration = scope ใหญ่แยกต่างหาก** (OAuth กับแอป ThaID + backend ตรวจ) — เอกสารหลักตั้งเป็นคำถามไว้แล้ว: phase ไหน? **แนะนำ phase แรกทำเฉพาะ form+OTP, ปุ่ม ThaID ซ่อนไว้** (noted → Open Questions 23)

### 1.3 OTP — `2.LINEOA-Registration-OTP.png`
- Route: `/register/otp`
- โครง: โลโก้ → คำอธิบาย "ส่งรหัส OTP ไปยังอีเมล... (อายุ 15 นาที)" → chip อีเมล (read-only) → label "รหัส OTP เลขอ้างอิง XXXX" → `OTPInput` (6 ตัว อักษร+เลข เช่น A1B2C3) → ลิงก์ "ส่งรหัสอีกครั้ง" ↻ → `PrimaryButton` ยืนยัน
- ⚠️ design ส่ง OTP ทาง**อีเมล** (ไม่ใช่ SMS ตามที่เดาไว้ในเอกสารหลัก 3.4) → backend ใช้ email service ไม่ต้องมี SMS provider — **อัปเดตเอกสารหลักด้วย**
- State: countdown ก่อนกดส่งซ้ำได้, แสดงเลขอ้างอิง (ref code) จาก response
- API: `POST /auth/register/verify-otp` `{otp, refCode}` → `{token, employee}` → เก็บ Zustand → ไปหน้า Complete
- Error: `OTP_INVALID` ใต้ช่อง, `OTP_EXPIRED` → เสนอส่งใหม่

### 1.4 สำเร็จ — `3.LINEOA-Registration-Complete.png`
- `SuccessScreen` (S17): เครื่องหมายถูก + ข้อความลงทะเบียนสำเร็จ + ปุ่มไปหน้าแรก/เริ่มใช้งาน → `navigate('/', {replace:true})` (ล้าง history กัน back กลับมา OTP)

## โครงไฟล์ feature

```
features/auth/
├── api/          # login(), requestOtp(), verifyOtp()
├── components/   # RegisterForm, OtpForm, ThaidButton
├── hooks/        # useAuth(), useRegister()
├── stores/       # auth store (token, employee)
├── pages/        # RegisterPage, OtpPage, RegisterSuccessPage
└── index.ts
```

## สรุป shared ที่ใช้: S11, S13, S16 (TextInput, OTPInput), S17, S18
## คำถามค้าง: domain อีเมลจริง? / ThaID phase ไหน? / นโยบาย OTP (อายุ 15 นาทีตาม design, จำกัดกี่ครั้ง/ชม.?)
