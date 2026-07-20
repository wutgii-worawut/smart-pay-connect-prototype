# เอกสารสรุป: โครงสร้างแบบ Feature-based สำหรับระบบ HR บน LINE LIFF

**ขอบเขตระบบ:** เงินเดือน (Payroll) + ระบบลา (Leave) + ลงเวลาเข้า-ออกงาน (Attendance) เปิดใช้งานผ่าน LINE OA Rich Menu → LINE LIFF

**เวอร์ชันเอกสาร:** 2.0 (จัดโครงใหม่) — กรกฎาคม 2026 | **เงื่อนไข:** ล็อก React 19

---

---

## สารบัญ


**ส่วน A — ภาพรวมและขอบเขตระบบ**
- 1. ทำไมถึงเลือกโครงสร้างแบบ Feature-based
- 2. ข้อมูลที่ระบบต้องใช้ (Data Requirements)
- 3. ขอบเขตฟีเจอร์จาก Design (SME-PAYROLL)

**ส่วน B — สถาปัตยกรรม Frontend**
- 4. Tech Stack (ล็อก React 19)
- 5. โครงสร้างโฟลเดอร์ที่แนะนำ
- 6. กฎเหล็กของโครงสร้าง (Architecture Rules)
- 7. การแยก Logic ออกจากหน้า — Pure .ts vs Custom Hook
- 8. Client state (Zustand) vs Server state (TanStack Query)
- 9. CSS Strategy สำหรับ Feature-based + Workflow กับ Figma
- 10. Component Strategy — เขียนเอง ~70% + shadcn/ui เฉพาะตัวยาก

**ส่วน C — LINE LIFF**
- 11. ประเด็นเฉพาะ LINE LIFF ที่ต้องรู้
- 12. การตั้งค่า LIFF
- 13. Session, Register และการ Verify token ฝั่ง Backend

**ส่วน D — ความปลอดภัย, GPS และ Backend**
- 14. ความปลอดภัย (สำคัญที่สุดสำหรับข้อมูลเงินเดือน)
- 15. GPS สำหรับลงเวลา (Clock-in / Clock-out)
- 16. API Contract และแนวทาง Backend (Java EE)

**ส่วน E — Role หัวหน้าทีมและ Approval**
- 17. Role หัวหน้าทีม และ Feature "อนุมัติ"

**ส่วน F — Environment และ Workflow การพัฒนา**
- 18. Environment & Deployment
- 19. Local Dev Workflow — ทำงานบน localhost ได้ + เทสบน Vercel ได้ ระหว่าง dev
- 20. Error Handling ฝั่ง UI — 4 ชั้นจากนอกเข้าใน
- 21. Testing Strategy — ทีมเล็ก test ที่คุ้มก่อน ไม่ไล่ coverage

**ส่วน G — แผนงานและเรื่องค้าง**
- 22. Recommendations (แผนลงมือทำ)
- 23. Open Questions — คำถามรอเคาะทั้งหมด (รวมที่เดียวกันลืม)
- ภาคผนวก: สิ่งที่ควรเช็กก่อนเริ่มจริง

---

# ส่วน A — ภาพรวมและขอบเขตระบบ

## 1. ทำไมถึงเลือกโครงสร้างแบบ Feature-based

ระบบนี้มี business domain แยกชัดเจน 4 กลุ่ม คือ auth, payroll, leave, attendance การจัดโค้ดตาม feature (แนวทาง bulletproof-react) ทำให้โค้ดของแต่ละ domain อยู่ที่เดียวกันทั้งหมด (api, components, hooks, types) แก้ไข feature ใดก็กระทบเฉพาะโฟลเดอร์นั้น ต่างจากแบบ type-based (components/, hooks/, pages/ รวมกันทั้งแอป) ที่โค้ดของ feature เดียวกระจายหลายที่และไม่ scale ส่วน Feature-Sliced Design (FSD) เต็มรูปแบบยังไม่จำเป็นสำหรับแอปขนาดนี้ — ให้ยืมเฉพาะแนวคิด unidirectional dependency และ public API ต่อ feature มาใช้พอ

| แบบ | เหมาะกับ | สรุป |
|---|---|---|
| Type-based | โปรเจกต์เล็กมาก / tutorial | ไม่แนะนำสำหรับระบบนี้ |
| **Feature-based (bulletproof-react)** | **แอปขนาดกลางที่ domain ชัด** | **แนะนำ ✅** |
| FSD เต็มรูปแบบ | ทีมใหญ่ 5-8 คนขึ้นไป / เกิน ~10 domain | ยังไม่จำเป็น ค่อยย้ายทีหลังได้ |

## 2. ข้อมูลที่ระบบต้องใช้ (Data Requirements)

### 2.1 ข้อมูลจาก LINE (ผ่าน LIFF)
- **ID Token** (`liff.getIDToken()`) — ใช้ยืนยันตัวตนกับ backend (ต้องเปิด scope `openid`)
- **LINE userId** (`sub` ใน payload) — ใช้ **เฉพาะค่าที่ backend verify แล้วเท่านั้น** เพื่อ map ไปยังรหัสพนักงาน
- **ชื่อ / รูปโปรไฟล์** (`name`, `picture`) — แสดงผลใน UI ได้ แต่ห้ามใช้เป็นตัวระบุตัวตนฝั่ง server

### 2.2 ข้อมูลหลักของระบบ (Master Data)
- **พนักงาน (Employee):** รหัสพนักงาน, ชื่อ-สกุล, ตำแหน่ง, แผนก, วันเริ่มงาน, สถานะ, LINE userId ที่ผูกไว้, เงินเดือนฐาน
- **สถานที่ทำงาน (Work Site):** ชื่อสาขา, พิกัด lat/lng, รัศมี geofence (เมตร)
- **กะ/เวลาทำงาน (Shift):** เวลาเข้า-ออก, วันทำงาน, กติกามาสาย
- **ประเภทการลา (Leave Type):** ลาป่วย, ลากิจ, ลาพักร้อน ฯลฯ + โควตาต่อปี + กติกา (ล่วงหน้ากี่วัน, ต้องแนบเอกสารไหม)

### 2.3 ข้อมูลธุรกรรม (Transactional Data)
- **การลงเวลา (Attendance Record):** employee id, ประเภท (เข้า/ออก), timestamp ฝั่ง server, พิกัด GPS, ผลตรวจ geofence, (option) รูป selfie
- **ใบลา (Leave Request):** ประเภทลา, ช่วงวันที่, เหตุผล, ไฟล์แนบ, สถานะ (รออนุมัติ/อนุมัติ/ไม่อนุมัติ), ผู้อนุมัติ, ยอดวันลาคงเหลือ
- **สลิปเงินเดือน (Payslip):** งวดเดือน, เงินเดือน, OT, เบี้ยขยัน, หักประกันสังคม, หักภาษี, ยอดสุทธิ — **อ่านอย่างเดียวจากฝั่งพนักงาน** คำนวณที่ backend เท่านั้น
- **Audit Log:** ทุก action สำคัญ (ลงเวลา, ยื่นลา, เปิดดูสลิป) พร้อม timestamp + พิกัด (ถ้ามี)

### 2.4 ข้อมูลฝั่ง Config / Environment
- `VITE_LIFF_ID` — LIFF ID จาก LINE Developers Console
- `LINE_LOGIN_CHANNEL_ID` — เก็บที่ **backend เท่านั้น** ใช้ตอน verify ID token
- Base URL ของ API, JWT secret (backend เท่านั้น)

## 3. ขอบเขตฟีเจอร์จาก Design (SME-PAYROLL)

สิ่งที่ design มีแต่ยังไม่อยู่ในหัวข้อก่อนหน้า — กระทบทั้ง frontend และ backend:

### 3.1 Remote Clock In/Out — ลงเวลานอกสถานที่ (กลุ่ม 2)
- ลงเวลามี 2 โหมด: **ในพื้นที่** (บังคับ geofence ตามหัวข้อ 15) และ **นอกสถานที่** (ไม่บังคับ geofence แต่**ต้องกรอกเหตุผล** และพิกัดถูกบันทึกเสมอ)
- ข้อมูลลงเวลาเพิ่ม field: `type: 'onsite' | 'remote'` + `remoteReason`
- Audit log แยกให้เห็นชัดว่าเป็น remote — เป็นจุดที่ HR/หัวหน้าควรตรวจย้อนหลังได้
- หน้า **Out of Range**: ปุ่มลงเวลา disable + แสดงระยะห่างจากจุดทำงาน → frontend เช็ค geofence เพื่อ UX (ตัวตัดสินจริงยังเป็น server ตามหัวข้อ 15) และเสนอทางเลือก "ลงเวลานอกสถานที่" แทน

> ⚠️ **Noted กันลืม — ความเสี่ยงเชิงนโยบาย (ยังไม่เคาะ):** Remote clock เป็นเรื่องเดียวใน design ที่เปิดช่อง "ลงเวลาโดยไม่ผ่าน geofence" อย่างเป็นทางการ — UX ถูกต้องแล้ว (มีเหตุผลกำกับ + พิกัดถูกเก็บ) แต่ต้องถามฝั่งธุรกิจก่อนขึ้นจริงว่า **remote clock ต้องให้หัวหน้ารับทราบ/อนุมัติย้อนหลังไหม หรือใครใช้ก็ได้อิสระ** — ถ้าอิสระ พนักงานทุกคนมีทางเลี่ยง geofence ในมือ ต่างกันแค่ต้องพิมพ์เหตุผล ตัวเลือกที่เป็นไปได้: (ก) อิสระ + หัวหน้าเห็นใน report, (ข) แจ้งเตือนหัวหน้าทุกครั้งที่มี remote clock, (ค) remote clock มีสถานะ "รอรับทราบ" ให้หัวหน้ากดรับทราบ, (ง) จำกัดสิทธิ์เฉพาะพนักงานที่ถูกตั้งค่าให้ทำงานนอกสถานที่ได้ (ดูตาราง 23.1 ข้อ 4)

### 3.2 ยกเลิกใบลาที่รออนุมัติ (กลุ่ม 3)
- ใบลาสถานะ `PENDING` เจ้าของยกเลิกเองได้ → status model ต้องมี `CANCELLED`
- Endpoint: `POST /leave/requests/:id/cancel` — เช็คว่าเป็นเจ้าของ + สถานะยัง PENDING เท่านั้น (ใบที่อนุมัติแล้วห้ามยกเลิกเองต้องผ่านหัวหน้า/ระบบเดิม)
- หลังยกเลิก → invalidate รายการ + ใบนั้นหายจากหน้า Pending ของหัวหน้าด้วย

### 3.3 ส่งสลิปเงินเดือนเข้าอีเมล (กลุ่ม 5)
- ปุ่ม "ส่งเข้าอีเมล" ในหน้า Payslip Details → backend สร้าง PDF + ส่งเมล
- **ความปลอดภัย:** ส่งไปอีเมลที่ลงทะเบียนไว้ในระบบเดิมเท่านั้น **ห้ามให้ผู้ใช้กรอกอีเมลปลายทางเอง** (กันส่งสลิปออกนอกตัวบุคคล) + เขียน audit log ทุกครั้ง (`PAYSLIP_EMAIL`)

### 3.4 Registration ด้วย OTP (กลุ่ม 1) — ปิดคำถามเปิดของ 13.2
- กลไกพิสูจน์ตัวจริงตอนผูกบัญชี = กรอกเลขบัตร ปชช. + อีเมลองค์กร แล้วยืนยันด้วย **OTP ส่งไปอีเมลที่ลงทะเบียนในระบบเดิม** (อายุ 15 นาที + เลขอ้างอิง ตาม design จอ OTP; มี variant Digital ID/ThaID)
- ต้องมี: **email service สำหรับส่ง OTP** (ไม่ใช่ SMS — design ยืนยันเป็นอีเมล), endpoint `POST /auth/register/request-otp` + `POST /auth/register/verify-otp`, จำกัดจำนวนครั้งขอ OTP (rate limit) และอายุ OTP สั้น
- ผูกสำเร็จ → บันทึก mapping `sub ↔ พนักงาน` + audit log ตาม flow 13.2 เดิม

### 3.5 ปฏิทินวันหยุด (กลุ่ม 6)
- หน้าวันหยุดบริษัท/นักขัตฤกษ์ + รายละเอียด → ต้องมี **holiday master** จากระบบ admin เดิม (`GET /holidays?year=`)
- กระทบ `countLeaveDays` (4.1): ต้องหัก**วันหยุดบริษัท**ด้วย ไม่ใช่แค่เสาร์อาทิตย์ — ปรับ signature เป็น `countLeaveDays(startStr, endStr, holidays: string[])` โดย frontend ดึง holidays จาก API (cache ด้วย TanStack Query ทั้งปี) และ server คำนวณซ้ำด้วยชุดวันหยุดเดียวกัน

### 3.6 อัปเดตโครง features/ (รวมของใหม่)

```
features/
├── auth/         # + register (OTP flow)
├── attendance/   # + remote clock, out-of-range state
├── leave/        # + cancel request
├── payroll/      # + email payslip
├── approval/     # ตาม 17.5
└── calendar/     # Leave Calendar (10.3) + Holidays  ← feature ที่ 6
```

> design แยก Calendar เป็นกลุ่มของตัวเอง (Leave Calendar + Holidays) — แนะนำแยกเป็น feature `calendar` ตามนั้น โดย `LeaveCalendar` component ที่ออกแบบใน 10.3 ย้ายมาอยู่ที่นี่ และ `leave` เรียกใช้ผ่านการ compose ระดับ page ตามกฎเหล็กข้อ 1

---

# ส่วน B — สถาปัตยกรรม Frontend

## 4. Tech Stack (ล็อก React 19)

| ส่วน | เลือกใช้ | หมายเหตุสำหรับ React 19 |
|---|---|---|
| Runtime UI | **React 19** | ตามที่ล็อกไว้ ✅ |
| Build tool | **Vite** (template `react-ts`) | CRA ถูก deprecate แล้ว; แอปอยู่หลัง LINE login ไม่ต้องการ SEO/SSR จึงไม่จำเป็นต้องใช้ Next.js |
| ภาษา | **TypeScript** | จำเป็นสำหรับระบบที่แตะข้อมูลเงินเดือน |
| Routing | **React Router v7** | รองรับ React 19 เต็มรูปแบบ ใช้ `createBrowserRouter` (History API ตามที่ LIFF แนะนำ) |
| Server state | **TanStack Query v5** | รองรับ React 19; ใช้กับข้อมูล payslip, leave balance, attendance status |
| Client state | **Zustand v5** | รองรับ React 19; ใช้กับ auth session, UI state |
| Form | **React Hook Form v7.66+** + **Zod v4** + `@hookform/resolvers` | RHF รองรับ React 19 ตั้งแต่ ~v7.54; ระวัง syntax Zod v3 vs v4 ต่างกัน (เช่น `z.email()` ใน v4) |
| Date | **date-fns** (+ locale `th`) | pure function + tree-shakable; เป็นฐานของ react-day-picker (shadcn Calendar) อยู่แล้วจึงไม่เพิ่ม library ซ้ำซ้อน; ปี พ.ศ. ต้องบวก 543 เอง (ดูหัวข้อ 4.1); **ไม่ใช้ moment** — อยู่ใน maintenance mode, bundle ~70KB tree-shake ไม่ได้, mutable |
| HTTP client | **axios** | instance เดียวใน `lib/api-client.ts` + interceptor (แนบ JWT, แกะ `{data}`, normalize เป็น `ApiError` — ดูหัวข้อ 20.3) |
| LIFF SDK | **`@line/liff`** (npm) | ติดตั้งเป็น package ดีกว่าฝัง CDN; ถ้าใช้ Provider สำเร็จรูปพิจารณา `use-line-liff` (มี mock) หรือเขียน LiffProvider เอง |
| Styling | Tailwind CSS (แนะนำ) | mobile-first ง่าย + รองรับฟอนต์ไทย (Kanit/Sarabun) |

**ข้อควรระวังเมื่อล็อก React 19:** เช็ก peer dependency ของทุก library ก่อนติดตั้ง (`npm info <pkg> peerDependencies`) — library ในตารางข้างต้นเวอร์ชันล่าสุดรองรับ React 19 แล้วทั้งหมด แต่ library เสริมอื่น ๆ (เช่น UI kit เก่า) อาจยังต้องการ React 18 ให้หลีกเลี่ยงหรือหาตัวแทน

### 4.1 การจัดการวันที่ด้วย date-fns

**เหตุผลที่เลือก date-fns (และไม่ใช้ moment):**
- ทีม Moment.js ประกาศเองว่าโปรเจกต์อยู่ใน **maintenance mode** — หยุดพัฒนาฟีเจอร์ใหม่ และแนะนำให้โปรเจกต์ใหม่ใช้ตัวอื่น
- moment หนัก ~70KB และ tree-shake ไม่ได้ (แอปรันใน LINE in-app browser ทุก KB มีผลต่อเวลาเปิดจาก Rich Menu) อีกทั้ง **mutable** (`date.add(1,'day')` แก้ค่าตัวแปรเดิม) เป็นต้นตอ bug และขัดกับกติกา pure function ใน `utils/` (หัวข้อ 7)
- date-fns เป็น pure function ล้วน tree-shake ได้ (import เฉพาะที่ใช้) มี locale `th` ในตัว และ**เป็นฐานของ react-day-picker (shadcn Calendar หัวข้อ 10) อยู่แล้ว** — ใช้ตัวเดียวทั้งแอป ไม่มี date library ซ้อนกัน
- (dayjs ก็เป็นตัวเลือกที่ดี ~7KB + plugin buddhistEra แต่แพ้ตรงจะกลายเป็น date library ตัวที่สองซ้อนกับ date-fns ของ Calendar / Temporal API ยังไม่พร้อม production)

**ปี พ.ศ. ต้องบวก 543 เอง** — locale `th` ให้ชื่อเดือน/วันไทย แต่ปียังเป็น ค.ศ. ทำเป็น helper กลางตัวเดียวใช้ทั้งแอป อย่าให้แต่ละหน้าบวกกันเอง:

```ts
// src/utils/date.ts  (shared — ใช้ทุก feature)
import { format, parse, eachDayOfInterval, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';

// "16 มิถุนายน 2569"
export function formatThaiDate(date: Date): string {
  const be = date.getFullYear() + 543;
  return format(date, `d MMMM '${be}'`, { locale: th });
}

// นับวันลา: ตัดเสาร์อาทิตย์ + หักวันหยุดบริษัท (3.5) — signature เดียวทั้งระบบ
// (preview ฝั่ง frontend — ตัวเลขที่ตัดโควตาจริง server คำนวณซ้ำด้วยชุดวันหยุดเดียวกัน)
export function countLeaveDays(
  startStr: string,           // 'YYYY-MM-DD'
  endStr: string,             // 'YYYY-MM-DD'
  holidays: string[],         // จาก GET /holidays?year= เช่น ['2026-07-28']
): number {
  // parse เป็น local date — ห้ามใช้ new Date(str) (กติกา 4.2)
  const start = parse(startStr, 'yyyy-MM-dd', new Date());
  const end = parse(endStr, 'yyyy-MM-dd', new Date());
  return eachDayOfInterval({ start, end }).filter(
    (d) => !isWeekend(d) && !holidays.includes(format(d, 'yyyy-MM-dd')),
  ).length;
}
// หมายเหตุ: ครึ่งวัน (เช้า/บ่าย = 0.5) จัดการที่ชั้นฟอร์มโดยคูณ/ปรับจากผลลัพธ์นี้
```

### 4.2 กติกาเรื่อง Timezone — แยกข้อมูลเวลาเป็น 2 ชนิด ห้ามปนกัน

| ชนิด | คืออะไร | เก็บ/รับ-ส่งเป็น | ตัวอย่าง |
|---|---|---|---|
| **Calendar date** (วันในปฏิทิน) | ไม่มี concept เวลา/timezone ในตัว | **string `YYYY-MM-DD` ตลอดสาย** ทั้ง frontend ↔ backend ↔ database | วันลา "1-3 ก.ค.", งวดเงินเดือน |
| **Instant** (จุดเวลาจริง) | timestamp ที่เกิดเหตุการณ์ | **server เป็นคนประทับเสมอ** เก็บ UTC แสดงผลเป็นเวลาไทย | เวลาลงเวลาเข้า-ออก, เวลาอนุมัติใบลา |

**เหตุผลและกับดักที่ต้องรู้:**
- กับดักคลาสสิก: `new Date('2026-07-01')` จะ parse เป็น **เที่ยงคืน UTC** ไม่ใช่เที่ยงคืนเวลาไทย — ไทยเป็น UTC+7 เลยรอดแบบฟลุก ๆ แต่ถ้าเครื่องพนักงานตั้ง timezone ผิด หรือ format กลับด้วย UTC วันจะเหลื่อมทันที → pure function ที่รับวันในปฏิทินให้รับ string แล้ว parse ด้วย `parse(str, 'yyyy-MM-dd', new Date())` ของ date-fns (parse เป็น local) หรือคำนวณจาก string ตรง ๆ
- **date-fns ตัวเปล่าไม่มีความสามารถด้าน timezone** — ถ้าจำเป็นต้องคำนวณอิง timezone จริง ๆ ต้องเพิ่ม `@date-fns/tz` แต่ถ้ายึดกติกาตารางข้างบน (calendar date = string, instant = server ประทับ) แอปขนาดนี้แทบไม่ต้องแตะ timezone library เลย — เรียบง่ายกว่าและพลาดยากกว่า
- เวลาเครื่องพนักงานเชื่อไม่ได้ (ตั้งเดินเร็ว/timezone ผิดได้) — ผลลัพธ์ที่มีผลจริงทุกอย่างจึงอิง server timestamp ตามกฎเดิม (หัวข้อ 14, audit log) ส่วน default "วันนี้" ใน date picker ความเสี่ยงต่ำเพราะ server validate ซ้ำอยู่ดี

## 5. โครงสร้างโฟลเดอร์ที่แนะนำ

> **หมายเหตุ:** tree ด้านล่างตั้งใจให้บรรทัดสั้น เพื่อไม่ให้ตัดคำบนจอมือถือ — คำอธิบายละเอียดของแต่ละส่วนอยู่ในตารางถัดไป

```
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   └── router.tsx
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── index.ts
│   ├── payroll/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── leave/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   └── attendance/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── index.ts
│
├── assets/            <- รูปที่ใช้ร่วม (โลโก้, ไอคอนประเภทลา)
├── components/        <- shared UI
├── hooks/             <- shared hooks
├── lib/
│   ├── liff/
│   ├── api-client.ts
│   └── query-client.ts
├── config/
├── stores/
├── types/
└── utils/
```

โครงสร้างแบ่งเป็น 3 ชั้น: **app/** (จุดประกอบแอป) → **features/** (โค้ดแยกตาม business domain, ทุก feature มีโครงภายในเหมือนกัน) → **shared** (ของกลางที่ไม่รู้จัก business ใด ๆ)

### 5.1 ชั้น app/ — จุดประกอบแอป

| ไฟล์ | หน้าที่ |
|---|---|
| `App.tsx` | component รากของแอป |
| `providers.tsx` | ประกอบ provider ซ้อนกันตามลำดับ: `LiffProvider` (เขียนเอง) → `QueryClientProvider` (จาก TanStack Query) → `RouterProvider` (จาก react-router-dom) |
| `router.tsx` | นิยามเส้นทาง `/attendance` `/leave` `/payroll` แล้ว export ตัวแปร `router` ให้ `RouterProvider` ใน providers.tsx ใช้ |

> `RouterProvider` และ `QueryClientProvider` เป็น component **จาก library** ไม่ต้องเขียนเอง แค่ import มาใช้ใน providers.tsx — ส่วน `LiffProvider` เราเขียนเอง (โค้ดเต็มอยู่หัวข้อ 12.2)

### 5.2 ชั้น features/ — โครงภายในของแต่ละ feature

ทุก feature ใช้โครงเดียวกัน 5 ส่วน:

| โฟลเดอร์/ไฟล์ | เก็บอะไร |
|---|---|
| `api/` | ฟังก์ชันยิง API ของ feature นั้น |
| `components/` | component ที่รู้เรื่อง domain นั้นโดยเฉพาะ |
| `hooks/` | custom hooks ของ feature |
| `types/` | TypeScript types ของ feature |
| `index.ts` | public API — export เฉพาะที่ให้ภายนอกใช้ |

ตัวอย่างเนื้อหาในแต่ละ feature (**ชื่อทั้งหมดเป็นชื่อสมมติที่เราเขียนเอง** ตั้งใหม่ได้ตามใจ):

| Feature | api/ | components/ | hooks/ |
|---|---|---|---|
| **auth** | `exchangeToken()`, `getMe()` | `ProtectedRoute` — กันคนไม่ login เข้าเพจ | `useAuth()` (+ `stores/` เก็บ session ด้วย zustand) |
| **payroll** | `getPayslips()`, `getPayslipDetail()` | `PayslipCard` — การ์ดสลิป 1 เดือน, `PayslipList`, `PayslipDetail` | `usePayslips()` |
| **leave** | `getLeaveBalance()`, `submitLeaveRequest()` | `LeaveForm` — ฟอร์มยื่นลา, `LeaveHistory`, `LeaveBalanceCard` — การ์ดวันลาคงเหลือ | `useLeaveBalance()`, `useSubmitLeave()` |
| **attendance** | `clockIn()`, `clockOut()`, `getTodayStatus()` | `ClockButton` — ปุ่มใหญ่กดลงเวลา, `AttendanceCalendar` — ปฏิทินประวัติ, `StatusBadge` — ป้ายสถานะวันนี้ เช่น "เข้างานแล้ว 08:45" / "มาสาย" | `useGeolocation()`, `useAttendance()` |

### 5.3 ชั้น shared — ของกลาง

| โฟลเดอร์ | เก็บอะไร |
|---|---|
| `assets/` | รูปที่ใช้ร่วมหลาย feature — `logo-smartpay`, `leave/leave-{vacation,sick,personal}` (ไอคอนของ LeaveTypeIcon) — **import ในโค้ดเสมอ** (`import x from '@/assets/...'`) ให้ Vite hash; `public/` มีแค่ favicon/og-image; รูปเฉพาะ feature → `features/<x>/assets/`; export จาก Figma เป็น SVG ก่อนเสมอ |
| `components/` | UI ล้วน ๆ ที่ไม่รู้เรื่อง business เลย เช่น `Button`, `Card`, `Spinner`, `BottomNav` |
| `hooks/` | shared hooks เช่น `useDebounce` |
| `lib/liff/` | `LiffProvider.tsx` + `index.ts` (โค้ดหัวข้อ 12.2) |
| `lib/api-client.ts` | axios/fetch instance + interceptor แนบ JWT |
| `lib/query-client.ts` | ตั้งค่า QueryClient ของ TanStack Query |
| `config/` | env, constants เช่น `VITE_LIFF_ID` |
| `stores/` | global zustand stores (ถ้ามี) |
| `types/` | shared types |
| `utils/` | เช่น format วันที่ พ.ศ., format สกุลเงินบาท |

**หลักตัดสินว่า component ควรอยู่ใน feature หรือ shared:**
- รู้เรื่อง business domain ใดโดเมนหนึ่ง (เช่น `StatusBadge` รู้ว่าสถานะลงเวลามีอะไรบ้าง) → อยู่ใน `features/<ชื่อ feature>/components/`
- เป็น UI ล้วน ๆ ใช้กับอะไรก็ได้ (เช่น `Button`, `Card`) → อยู่ใน `src/components/` (shared)
- ถ้าภายหลังหลาย feature อยากใช้หน้าตาเดียวกัน ค่อยแยกส่วน UI ล้วนออกมาเป็น shared component แล้วให้แต่ละ feature ห่อด้วย logic ของตัวเอง

## 6. กฎเหล็กของโครงสร้าง (Architecture Rules)

1. **ห้าม import ข้าม feature โดยตรง** — ถ้า `attendance` ต้องใช้ข้อมูลจาก `auth` ให้ compose ที่ระดับ `app/` แทน
2. **Dependency ไหลทางเดียว (unidirectional):** `shared (components/hooks/lib/utils/types)` → `features` → `app` — shared ห้าม import จาก features และ features ห้าม import จาก app
3. **แต่ละ feature มี `index.ts` เป็น public API** — export เฉพาะสิ่งที่ตั้งใจให้ภายนอกใช้ (แต่อย่าทำ barrel file ที่ re-export ทุกไฟล์ เพราะกระทบ tree-shaking ของ Vite)
4. **บังคับกฎด้วย ESLint** ตั้งแต่วันแรก:

```js
// .eslintrc
'import/no-restricted-paths': [
  'error',
  {
    zones: [
      // ห้าม cross-feature import (ทำ zone แบบนี้ให้ครบทุก feature)
      { target: './src/features/payroll', from: './src/features', except: ['./payroll'] },
      { target: './src/features/leave', from: './src/features', except: ['./leave'] },
      { target: './src/features/attendance', from: './src/features', except: ['./attendance'] },
      { target: './src/features/auth', from: './src/features', except: ['./auth'] },
      // features ห้าม import จาก app
      { target: './src/features', from: './src/app' },
      // shared ห้าม import จาก features/app
      {
        target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
        from: ['./src/features', './src/app'],
      },
    ],
  },
],
```

5. **Logic ทางธุรกิจที่มีผลต่อเงิน (คำนวณเงินเดือน, ตัดโควตาลา, ตัดสิน geofence) อยู่ backend เท่านั้น** — frontend เป็นแค่หน้าจอแสดงผลและส่งคำขอ

## 7. การแยก Logic ออกจากหน้า — Pure .ts vs Custom Hook

### 7.1 เกณฑ์เดียวที่ใช้ตัดสิน: "logic ชิ้นนั้นแตะ React ไหม"

| ชนิด logic | เก็บที่ | ตัวอย่าง | เหตุผล |
|---|---|---|---|
| **ไม่แตะ React** (pure function: รับ input คืน output, ไม่มี state/effect) | ไฟล์ `.ts` ธรรมดาใน `utils/` | แปลงวันที่เป็น พ.ศ., format เงินบาท, `countLeaveDays(start, end, holidays)` ตัดเสาร์อาทิตย์, ตัดสิน "มาสาย" จากเวลาเข้า+เวลากะ | test ง่ายสุดในระบบ (ยัด input เช็ค output ไม่ต้อง render), reuse ได้ทุกที่แม้นอก component |
| **แตะ React** (ใช้ useState/useEffect/useQuery/context) | custom hook ใน `hooks/` | `useLeaveBalance()` (ห่อ TanStack Query), `useGeolocation()` (permission + loading), `useAuth()` | hook คือ "กาว" เชื่อมโลก React เข้ากับข้อมูล/พฤติกรรม |

### 7.2 โครงชั้นของหนึ่งหน้า (ตัวอย่างฟอร์มลา)

```
features/leave/
├── utils/leave-days.ts        # pure: countLeaveDays(...)
│                              #   test ด้วย vitest ตรง ๆ ไม่ต้องมี React
├── hooks/useSubmitLeave.ts    # hook: useMutation + invalidate balance
│                              #   + เรียก countLeaveDays มาใช้
├── components/LeaveForm.tsx   # UI: RHF + Zod + เรียก useSubmitLeave()
└── pages/LeavePage.tsx        # ประกอบร่าง แทบไม่มี logic
```

**ทิศทาง import ไหลทางเดียว:** `component → hook → pure .ts` — ห้ามย้อนกลับ (pure function ห้าม import hook เด็ดขาด ไม่งั้นความ pure หายทันที)

### 7.3 แยกเมื่อมีสัญญาณ ไม่ใช่แยกดักทุกอย่างตั้งแต่แรก

เริ่มเขียนในหน้าก่อนได้ แล้วแยกเมื่อเจออาการเหล่านี้:
1. ไฟล์หน้าเกิน ~150-200 บรรทัด และส่วนใหญ่ไม่ใช่ JSX
2. มี `useState`/`useEffect` เกิน 2-3 ชุดที่จัดการเรื่องเดียวกัน → มัดรวมเป็น hook หนึ่งตัวชื่อสื่อความ (`useAttendanceStatus`)
3. เจอสูตรคำนวณ/เงื่อนไขซับซ้อนแทรกใน JSX → ดึงเป็น pure function ทันที (นั่นคือของที่ต้อง test)
4. อยาก copy logic ไปหน้าที่สอง → ห้าม copy ให้แยกแล้ว import

### 7.4 ข้อควรระวังฝั่งตรงข้าม (ทำมากไปก็เสีย)

- **อย่าสร้าง hook ห่อของที่ไม่มี React ข้างใน** — เช่น `useFormatCurrency()` ที่ข้างในไม่มี state เลย ควรเป็น `formatCurrency()` ใน `.ts` เฉย ๆ เพราะพอเป็น hook จะติดกฎ Rules of Hooks ทันที (เรียกใน loop ไม่ได้, เรียกนอก component ไม่ได้) เสียความยืดหยุ่นฟรี
- **อย่าแยก hook ทั้งที่ใช้ที่เดียวและมี 5 บรรทัด** — abstraction ที่มาก่อนความจำเป็นคือหนี้
- **Logic การตัดสินที่มีผลจริง (คำนวณเงิน, ตัดโควตา, geofence) ฝั่ง frontend เป็นแค่ preview** — แยก `countLeaveDays` ไว้เพื่อโชว์ผู้ใช้ทันทีว่า "ลาครั้งนี้กิน 3 วัน" แต่ตัวเลขที่ตัดโควตาจริงมาจาก server คำนวณซ้ำเสมอ (กฎเหล็กข้อ 5 หัวข้อ 6)
- **สื่อสารสถานะ "ตัวเลขคาดการณ์" ใน UI ให้ชัด** — ยอดวันลาคงเหลือที่แสดงในฟอร์มคือ snapshot ณ ตอน query อาจมีใบลาอื่นถูกอนุมัติแทรกระหว่างกรอก (race condition) ทำให้ยอดจริงตอน server ตัดไม่พอ:
  - ฝั่ง UI: label ตัวเลขว่า "คงเหลือ (โดยประมาณ)" + ข้อความเล็กใน `LeaveForm` ว่า *"ยอดวันลาจะถูกหักอย่างเป็นทางการเมื่อคำขอได้รับการอนุมัติ"* — ป้องกันข้อพิพาทเมื่อ backend ปฏิเสธเพราะโควตาชนกัน
  - ฝั่ง backend (ตัวกันจริง): ตัดโควตาแบบ **atomic** — เช็คยอดและตัดใน database transaction เดียว (หรือ conditional update เช่น `UPDATE ... WHERE remaining >= days`) ห้ามเช็คแล้วค่อยตัดแยกคนละ query ไม่งั้นโควตาติดลบได้เมื่อสองคำขอเข้าพร้อมกัน — ข้อความกำกับช่วยเรื่องความคาดหวังผู้ใช้ แต่ตัวกันโควตาติดลบอยู่ที่ database

## 8. Client state (Zustand) vs Server state (TanStack Query)

ข้อมูลในแอปมี 2 ชนิดที่ธรรมชาติต่างกันคนละโลก จึงใช้เครื่องมือคนละตัว

### 8.1 Server state — ใช้ TanStack Query

**นิยาม:** ข้อมูลที่ "ความจริงอยู่ที่ server" เราแค่ยืมมาแสดง เช่น สลิปเงินเดือน, ยอดวันลาคงเหลือ, สถานะลงเวลาวันนี้, ประวัติการลา

**นิสัยของข้อมูลชนิดนี้:** ต้อง fetch แบบ async, ล้าสมัยได้ตลอดเวลา (HR อนุมัติใบลาตอนไหนก็ไม่รู้), ต้องมี loading/error state, ถูกเรียกซ้ำจากหลายหน้าจอ — ถ้าจัดการเองด้วย `useEffect` + `useState` ต้องเขียน loading flag, error handling, กัน fetch ซ้ำ, จัดการ cache เองทุกจุด

**TanStack Query กินงานพวกนี้ทั้งหมด และทำงานตอน:**
- component mount → เช็ก cache ก่อน ถ้ามีของแสดงทันที แล้ว refetch เบื้องหลังให้สดเสมอ
- ผู้ใช้สลับกลับมาที่แท็บ/หน้าจอ → refetch อัตโนมัติ
- หลัง mutation → เช่น ยื่นใบลาสำเร็จ สั่ง invalidate ให้ยอดวันลาคงเหลือ refetch เอง

```tsx
// features/leave/hooks/useLeaveBalance.ts
const { data, isLoading, error } = useQuery({
  queryKey: ['leave-balance'],
  queryFn: getLeaveBalance,
});
// 3 บรรทัด ได้ cache + loading + error + auto-refetch ครบ
```

### 8.2 Client state — ใช้ Zustand

**นิยาม:** ข้อมูลที่ "เกิดและตายในเครื่องผู้ใช้" server ไม่รู้จัก เช่น JWT session หลัง login, แท็บที่เลือกอยู่, modal เปิด/ปิด

**นิสัย:** synchronous ล้วน ๆ ไม่มี loading ไม่มี cache ไม่ต้อง refetch — Zustand เป็นกล่องเก็บของเบา ๆ สำหรับ state ที่หลาย component ต้องเห็นร่วมกัน

```tsx
// features/auth/stores/auth-store.ts
const useAuthStore = create((set) => ({
  token: null,
  employee: null,
  setSession: (token, employee) => set({ token, employee }),
  logout: () => set({ token: null, employee: null }),
}));
```

### 8.3 แบ่งงานในแอปนี้

| ข้อมูล | ใช้อะไร |
|---|---|
| payslips, leave balance, leave history, attendance status, attendance calendar | **TanStack Query** (ทุกอย่างที่มาจาก API) |
| JWT session หลัง login, UI state เล็ก ๆ | **Zustand** |
| state ที่ใช้ใน component เดียว | `useState` ธรรมดา |

แอปแบบนี้ Zustand จะมีงานน้อยมาก (อาจมี store เดียวคือ auth) — เป็นเรื่องปกติ ไม่ใช่สัญญาณว่าใช้ผิด

### 8.4 แล้ว Redux จำเป็นไหม?

**ไม่จำเป็นสำหรับโปรเจกต์นี้** — สมัยก่อน Redux ทำสองงาน: client state + เก็บข้อมูลจาก server (ผ่าน thunk/saga) แต่ TanStack Query ทำงานฝั่ง server state ได้ดีกว่ามาก (cache, refetch, invalidation ให้ฟรี) งานที่เหลือของ Redux คือ client state ล้วน ๆ ซึ่งแอปนี้มีนิดเดียว ใช้ Redux จะได้ boilerplate มาแลกกับความสามารถที่ไม่ได้ใช้

Redux (Redux Toolkit) ยังเหมาะกับ: client state ซับซ้อนและเชื่อมโยงกันเยอะ (editor, แอปวาดรูป), ต้องการ time-travel debugging, ทีมใหญ่ที่ต้องการ pattern บังคับเข้มงวด — ไม่ใช่โปรไฟล์ของแอป HR ที่ 90% คือดึงข้อมูลมาแสดงกับส่งฟอร์ม

**สูตรจำง่าย:** ข้อมูลมาจาก API → TanStack Query | ข้อมูลเกิดในเครื่อง → Zustand (หรือ useState ถ้า component เดียว) | Redux → ไม่ต้องนึกถึงจนกว่า client state จะซับซ้อนจนเอาไม่อยู่

## 9. CSS Strategy สำหรับ Feature-based + Workflow กับ Figma

### 9.1 หลักการเดียวกับโค้ด

สไตล์ของ feature ไหนอยู่กับ feature นั้น ของกลางมีที่เดียว — ต้องได้คุณสมบัติ "ลบโฟลเดอร์ feature แล้วสไตล์ของมันหายตาม" และห้ามมี `styles.css` ก้อนกลางที่ class ชนกันข้าม feature

### 9.2 เปรียบเทียบ 3 แนวทาง

| แนวทาง | เข้ากับ feature-based | เหมาะเมื่อ | ข้อเสีย |
|---|---|---|---|
| **Tailwind CSS** ✅ แนะนำ | ดีที่สุด — สไตล์ฝังใน JSX ลบ component สไตล์หายตาม ไม่มี class ชน | mobile-first, มี Figma, อยากทำงานเร็ว | JSX ดูรกช่วงแรก, class ซ้ำต้อง refactor เป็น component (จริง ๆ เป็นข้อดี) |
| **CSS Modules** | ดี — `.module.css` วางคู่ component, Vite hash class ให้ไม่ชน | ทีมถนัด CSS ตรง ๆ ไม่อยากเรียน Tailwind | ไฟล์เยอะเท่าตัว, responsive ต้องเขียน media query เอง, tokens ต้องทำเองผ่าน CSS variables |
| **CSS-in-JS** (styled-components ฯลฯ) ❌ | — | — | runtime overhead บนมือถือ + ecosystem ปรับตัวกับ React 19 ช้า เสี่ยง compatibility |

> ผสมได้: Tailwind เป็นหลัก แต่ component ที่ CSS ซับซ้อนจริง ๆ อนุญาตให้มี `.module.css` แปะคู่เฉพาะตัวได้ ตราบใดที่ไฟล์อยู่ในโฟลเดอร์ feature เดียวกัน

### 9.3 โครงไฟล์และ Design Tokens

```
src/
├── styles/
│   └── globals.css      <- CSS global ไฟล์เดียวที่อนุญาต
├── components/          <- shared UI (Tailwind ใน JSX)
└── features/.../components/
```

```css
/* styles/globals.css — Tailwind v4 กำหนด token ผ่าน @theme */
@import "tailwindcss";

@theme {
  /* ตั้งชื่อตามที่ Figma ตั้ง จะได้คุยกับ designer ภาษาเดียวกัน */
  /* ⚠️ ค่าสีเป็น placeholder อ่านจากภาพ design — ดูดค่าจริงจาก Figma ก่อนใช้ (9.5) */
  --color-primary: #1B6BB8;        /* น้ำเงินหลักตาม design SME-PAYROLL */
  --color-primary-dark: #16335B;
  --color-surface: #f7f8fa;
  --color-text-secondary: #8b95a1;

  --font-sans: "Kanit", sans-serif;
  --radius-card: 16px;
  --shadow-card: 0 2px 8px rgb(0 0 0 / 0.06);
}
```

เขียน component ด้วย `bg-primary rounded-card shadow-card` — designer ปรับสีทีหลัง แก้ที่เดียวจบ

### 9.4 กติกา 4 ข้อ (ล้อกับกฎเหล็กหัวข้อ 6)

1. `styles/globals.css` เป็น CSS global ไฟล์เดียวที่อนุญาต — เก็บ tokens (`@theme`), ฟอนต์ไทย, safe-area (`env(safe-area-inset-*)`), reset เท่านั้น ห้ามมี class เฉพาะ feature แอบอยู่
2. สไตล์ของ feature อยู่ใน JSX ของ component ใน feature นั้น — ห้ามมีไฟล์ CSS ให้ feature อื่น import ข้าม
3. เห็นชุด class ซ้ำเกิน 2-3 ที่ → ยกเป็น shared component ใน `src/components/` (เช่น `<Card>`, `<Badge>`) อย่า copy class
4. สี/spacing ใช้ผ่าน token เสมอ ห้าม arbitrary value (`bg-[#xxx]`) ยกเว้นจุดที่ใช้ครั้งเดียวจริง ๆ

**เสริม:** ถ้าต้องการ component สำเร็จรูป (dialog, dropdown, calendar) พิจารณา **shadcn/ui** — เป็นการ copy โค้ดมาไว้ใน `src/components/` ของเราเอง (เราเป็นเจ้าของ แก้ได้เต็มที่) ใช้ Tailwind อยู่แล้ว รองรับ React 19 — แต่ให้ดูก่อนว่า design ใน Figma ไปทางเดียวกับหน้าตา shadcn ไหม ถ้าใกล้เคียงใช้เป็นโครงแล้วแก้สไตล์ตาม Figma ถ้าฉีกคนละทางเขียนเองจาก token ตรง ๆ เร็วกว่า

### 9.5 Workflow กับ Figma

**ลำดับงานเหมือนกันทั้งสองแผน:**

```
1) ถอด design tokens จาก Figma → ลง @theme ให้ครบก่อนเขียนหน้าจอแรก
2) ดู Figma component library → ตัดสิน shared vs feature
   - ใช้ซ้ำหลายหน้าจอ (Button, Card, Input, BottomNav) → src/components/
   - โผล่เฉพาะหน้าจอเดียว (การ์ดสลิป, ปุ่มลงเวลา, StatusBadge) → features/<x>/components/
3) ตอนเขียนแต่ละหน้าจอ ใช้ Figma เป็น "สเปก" ไม่ใช่ "โค้ด"
   → อ่านค่า (สี spacing radius font) แล้วเขียน layout ด้วย flex/grid เอง
   → ห้ามเอาโค้ดที่ Figma แปลงให้ไปวางตรง ๆ (จะได้ absolute positioning
     + arbitrary value เต็มไปหมด responsive พังบนหลายขนาดจอ)
```

#### Version A — แผนฟรี (Free/Starter): อ่านค่าเองจากเครื่องมือฟรี

| ต้องการ | ทำยังไง (ของฟรีทั้งหมด) |
|---|---|
| สี, ขนาด, radius, ฟอนต์, เงา | คลิกเลือก element → อ่านจาก **Design panel ขวามือ** (กด swatch สีเพื่อ copy hex) |
| spacing ระหว่าง element | เลือก element แล้วกด **`Alt` (Win) / `Option` (Mac) ค้าง** + hover element อื่น → Figma ขึ้นเส้นแดงบอกระยะเป็น px (ใช้อ่าน padding/gap/margin) |
| CSS อ้างอิงของ element | คลิกขวา → Copy/Paste as → **Copy as CSS** (ใช้ดึงค่าเท่านั้น อย่าวางใช้ตรง ๆ) |
| Styles/Variables ที่ designer นิยาม | คลิก element ที่ผูก style → panel ขวาโชว์ชื่อ style กดเข้าไปดูค่า / deselect ทั้งหมดเพื่อดูรายการ styles ทั้งไฟล์ |
| Export icon/รูป | เลือก element → **Export** มุมขวาล่าง → SVG/PNG |
| ตัวช่วยเสริม | plugin ฟรีใน Figma Community (ค้น "Tailwind") — ใช้อ่านค่าเร็ว ๆ แต่โค้ดที่แปลงให้มีปัญหา absolute positioning เหมือนกัน |

#### Version B — แผนเสียเงิน (มี Dev Mode seat)

| ต้องการ | ทำยังไง |
|---|---|
| ค่าทั้งหมด + CSS | เปิดสวิตช์ **Dev Mode** (มุมขวาบน) → คลิก element เห็นค่า + CSS/iOS/Android snippet ทันที |
| spacing | Dev Mode โชว์ระยะห่างรอบ element อัตโนมัติเมื่อ hover ไม่ต้องกด Alt |
| Variables → token | แท็บ variables ใน Dev Mode ดูชื่อ+ค่าทั้งชุด copy ลง `@theme` ได้เร็ว |
| ติดตามงาน | มี status "Ready for dev" ให้ designer mark ว่าหน้าจอไหนพร้อมตัด + เทียบ diff เมื่อ design เปลี่ยน |
| ข้อควรระวังเดิม | โค้ดที่ Dev Mode สร้างก็เป็น absolute positioning — ใช้เป็นสเปกอ่านค่า ไม่ copy ไปใช้ตรง ๆ เหมือนกัน |

**สรุปความต่างสองแผน:** ข้อมูลที่ได้เหมือนกันทุกอย่าง ต่างแค่ความเร็วในการอ่านค่า (แผนฟรีกดอ่านเองทีละจุด แผนเสียเงินมีแท็บสรุปให้) — สำหรับแอปขนาด 4 feature ใช้แผนฟรีทำได้สบายโดยไม่ช้ากว่ากันมีนัย

**ข้อควรเช็กก่อนเริ่ม:** ถ้าไฟล์ Figma ไม่ได้ทำ Styles/Variables ไว้ (ใส่สี/spacing มือเปล่าทีละจุด) ให้เพิ่มขั้นตอน "ไล่เก็บค่าที่ใช้จริงทั้งไฟล์มาสรุปเป็น token เอง" ก่อน — ดูว่าใช้สีอะไรบ้าง spacing กี่ขนาด แล้วจึงลง `@theme` ไม่งั้น token จะมั่วตาม design

## 10. Component Strategy — เขียนเอง ~70% + shadcn/ui เฉพาะตัวยาก

### 10.1 Inventory component ของแอปนี้ (~15-20 ตัว)

| Feature | Component ที่ต้องมี |
|---|---|
| attendance | ปุ่มลงเวลาใหญ่, badge สถานะ, ปฏิทินประวัติ, กล่องยืนยัน (bottom sheet) |
| leave | ฟอร์ม (input, select, date range picker, textarea, upload), รายการประวัติ, badge สถานะอนุมัติ |
| payroll | การ์ดรายการ, หน้ารายละเอียด, ตารางรายการหักบวก |
| ทั่วไป | BottomNav, Spinner/skeleton, toast |

ส่วนใหญ่เป็น **ของง่าย** (ปุ่ม การ์ด badge list) เขียนเองจาก token ใน `@theme` ตรง Figma กว่าและเร็วกว่าดัด library — แต่มี **4-5 ตัวที่ยากจริง** เพราะมี behavior/accessibility ซ่อนอยู่: **calendar/date picker** (ยากสุดในแอปนี้), **dialog/bottom sheet** (focus trap, swipe ปิด, กัน scroll ทะลุ), **select/dropdown**, **toast** (queue, animation)

### 10.2 ทางเลือก: ใช้ shadcn/ui แบบเลือกจุด ไม่ยกทั้งชุด

**เหตุผลที่ shadcn ชนะสำหรับเคสนี้:**
1. ไม่ใช่ dependency — copy โค้ดเข้า `src/components/ui/` เราแก้สไตล์ตรง Figma ได้ 100% ไม่ต้องสู้ theme API ใคร
2. ใช้ Tailwind อยู่แล้ว — token ใน `@theme` ไหลเข้าไปเลย
3. ข้างใต้เป็น Radix primitives ที่ accessibility ครบ
4. หยิบทีละตัวได้: `npx shadcn add drawer dialog select calendar sonner` แค่ที่ใช้จริง

**ที่ไม่แนะนำ:** MUI / Ant Design (ดัดให้ตรง Figma คืองานถาวร + คนละระบบสไตล์กับ Tailwind + bundle ใหญ่), daisyUI (หน้าตาตายตัว สุดท้าย override จนไม่เหลือประโยชน์), CSS-in-JS component libs (ประเด็น React 19 ตาม 9.2), Radix เปล่า ๆ โดยตรง (shadcn คือสิ่งเดียวกันบวกสไตล์ตั้งต้นให้แล้ว)

**กติกา:**
- Component ที่ shadcn generate → `src/components/ui/` (shared UI ล้วน) / Component ที่ประกอบจากมันและรู้ business → `features/<x>/components/` (เส้นแบ่งเดิมจากหัวข้อ 5)
- อย่า add เกินใช้ — ทุกตัวที่ add คือโค้ดที่เรา maintain เอง
- ตัวง่าย (Button/Card/Badge) เขียนเองจาก Figma ตรง ๆ
- มือถือเป็นหลัก: ใช้ **Drawer (bottom sheet, ข้างใต้คือ vaul รองรับ swipe ปิด)** แทน dialog กลางจอ สำหรับกล่องยืนยันและรายละเอียด — **checklist เมื่อใช้ใน LINE in-app browser:**
  - [ ] ใส่ padding ล่างกัน safe-area **ใน Drawer ด้วย** เช่น `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` — คนมักใส่ที่ BottomNav แล้วลืมใน sheet ที่ลอยทับ ทำให้ปุ่มยืนยันโดนแถบของ LINE/home bar บัง
  - [ ] ทดสอบ swipe gesture บนเครื่องจริงทั้ง iOS/Android — บน iOS การปัดลงปิด Drawer อาจตีกับ gesture ปัดปิด LIFF view ของ LINE เอง ถ้าตีกันจริงค่อยพิจารณาปรับ/ปิด `dismissible` (อย่าปิดดักไว้ก่อน เพราะ swipe ปิดคือจุดขายของ bottom sheet)
  - [ ] มีปุ่มปิดชัดเจนใน Drawer เสมอ อย่าพึ่ง gesture ทางเดียว
- React 19: shadcn/Radix/react-day-picker เวอร์ชันปัจจุบันรองรับแล้ว แต่เช็ก peer dependency ตอน add ทุกครั้งตามกฎเดิม

### 10.3 Case study: LeaveCalendar — ปฏิทินจุดสีตามประเภทลา

**โจทย์:** แต่ละวันแสดงจุดสีตามประเภทลาที่มีในวันนั้น (พักร้อน=เขียว, ป่วย=แดง, กิจ=น้ำเงิน) กดวันแล้วค่อยเห็นรายละเอียดว่าใครลาอะไร

**ดีไซน์สองชั้น:**
- **ชั้นปฏิทิน** — จุดตาม **ประเภท** ไม่ใช่ตามคน (มี 3 ประเภท = อย่างมาก 3 จุด ไม่มีทางล้นช่อง ต่อให้พักร้อน 5 คนก็จุดเดียว)
- **ชั้นรายละเอียด** — กดวัน → เปิด Drawer (bottom sheet) แสดงรายชื่อ+ประเภท+ช่วงเวลา

**API แยกสองเส้นตามสองชั้น:**

```
GET /leave/calendar?month=2026-07
→ [{ "date": "2026-07-01", "types": ["vacation", "sick"] }, ...]
   (ทั้งเดือนไม่กี่สิบแถว โหลดครั้งเดียวตอนเปิดปฏิทิน)

GET /leave/calendar/2026-07-01
→ [{ "employeeName": "สมชาย", "type": "vacation", "period": "เต็มวัน" },
   { "employeeName": "สมหญิง", "type": "sick", "period": "ครึ่งเช้า" }]
   (โหลดตอนกดวันเท่านั้น — TanStack Query cache ให้ วันที่เคยกดเปิดซ้ำได้ทันที)
```

**วิธี custom ด้วย shadcn Calendar (react-day-picker):** react-day-picker เปิดให้แทนที่ component ที่ render แต่ละช่องวันผ่าน prop `components` — เขียนช่องวันเองเป็น "เลขวัน + แถวจุดข้างใต้":

```tsx
// features/leave/components/LeaveCalendar.tsx
import { Calendar } from '@/components/ui/calendar';
import { DayButton } from 'react-day-picker';
import { format } from 'date-fns';

// จาก GET /leave/calendar → map วันที่ -> ประเภทลาของวันนั้น
type LeaveMap = Record<string, LeaveType[]>;

const DOT_COLOR: Record<LeaveType, string> = {
  vacation: 'bg-leave-vacation',   // เขียว — token ใน @theme
  sick: 'bg-leave-sick',           // แดง
  personal: 'bg-leave-personal',   // น้ำเงิน
};

function LeaveDayButton(
  { day, leaveMap, ...props }:
  React.ComponentProps<typeof DayButton> & { leaveMap: LeaveMap }
) {
  const types = leaveMap[format(day.date, 'yyyy-MM-dd')] ?? [];
  return (
    <DayButton day={day} {...props}>
      <div className="flex flex-col items-center gap-0.5">
        <span>{day.date.getDate()}</span>
        <span className="flex gap-0.5 h-1.5">
          {types.map((t, i) => (
            <span key={i}
              className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[t]}`} />
          ))}
        </span>
      </div>
    </DayButton>
  );
}

export function LeaveCalendar(
  { leaveMap, onPickDay }:
  { leaveMap: LeaveMap; onPickDay: (d: Date) => void }
) {
  return (
    <Calendar
      onDayClick={onPickDay}   // → เปิด LeaveDayDetailSheet (Drawer)
      components={{
        DayButton: (props) => (
          <LeaveDayButton {...props} leaveMap={leaveMap} />
        ),
      }}
    />
  );
}
```

**หมายเหตุการทำหน้าตาแบบไทย:**
- ชื่อเดือน/วัน ภาษาไทย → `locale: th` จาก `date-fns/locale`
- ปี พ.ศ. → custom component `MonthCaption` (แทนได้ผ่าน prop `components` เช่นเดียวกับ DayButton) แสดง ค.ศ. + 543
- สีจุดผูกเป็น token ใน `@theme` (เช่น `--color-leave-vacation`) ตามกติกาหัวข้อ 9

**เรื่องสิทธิ์ (สำคัญกว่า UI):** ชั้นปฏิทินปลอดภัย (ไม่มีชื่อคน) แต่ชั้น Drawer เปิดเผยว่า "ใครลาป่วย" ซึ่งเป็นข้อมูลสุขภาพ (อ่อนไหวตาม PDPA) — ตัดสินใจเชิงนโยบายว่า detail endpoint คืนอะไรให้ใคร เช่น พนักงานทั่วไปเห็นชื่อ+คำว่า "ลา" รวม ๆ, หัวหน้า/HR เห็นประเภทจริง — **กรองที่ backend ตาม role** (frontend แค่ render ตามที่ API คืน) ตัดสินใจตอนออกแบบ endpoint ไม่ใช่ตอนโดนทัก

---

# ส่วน C — LINE LIFF

## 11. ประเด็นเฉพาะ LINE LIFF ที่ต้องรู้

1. **ใช้ 1 LIFF app + client-side routing (History API)** — LINE แนะนำอย่างเป็นทางการให้ทำ SPA ด้วย History API (LIFF เข้ากันได้จำกัดกับ hash routing) ไม่ต้องแยกหลาย LIFF ID ต่อเมนู
2. **Deep link จาก Rich Menu** — ต่อ path ท้าย LIFF URL ได้เลย เช่น `https://liff.line.me/{liffId}/attendance` LINE จะ encode path เป็น query `liff.state` แล้ว SDK พากลับไป path ปลายทางหลัง `liff.init()` เสร็จ (ต้องใช้ LIFF SDK v2.3.0+ โหมด Concatenate ซึ่งเป็นค่า default)
3. **ตั้ง Endpoint URL เป็น root (`/`)** — ตั้งแต่ LIFF v2.27.2 ถ้าเรียก `liff.init()` บน URL ที่ไม่อยู่ใต้ Endpoint URL จะมี warning; ตั้งเป็น root ทำให้ทุก sub-path (`/payroll`, `/leave`, `/attendance`) ทำงานได้แน่นอน
4. **Access token อายุ 12 ชั่วโมง และอาจถูก revoke เมื่อผู้ใช้ปิด LIFF** — อย่าพึ่ง LINE token เป็น session ของแอป ให้ verify ครั้งแรกแล้วออก JWT ของระบบเอง
5. **API ที่ต้องขอ permission (GPS, กล้อง, ไมค์) ต้องถูกเรียกจาก user action เท่านั้น** — เช่นกดปุ่มก่อน ห้ามเรียกตอน page load (เป็นกฎใน LIFF development guidelines)
6. **LIFF ต้องรันบน HTTPS เท่านั้น** — ซึ่งจำเป็นต่อ Geolocation API อยู่แล้ว
7. **รันใน in-app browser ของ LINE** — ออกแบบ mobile-first, ระวัง safe area (notch/home bar), เลือก view size เป็น Full หรือ Tall สำหรับแอปที่เนื้อหาเยอะ
8. **`liff.closeWindow()` ใช้ได้เฉพาะใน LINE client** — เช็ก `liff.isInClient()` ก่อนเรียก
9. **Dev บนเครื่อง local** — พิจารณา `@line/liff-mock` (ผ่าน library เช่น `use-line-liff`) เพื่อพัฒนาโดยไม่ต้องเปิดผ่าน LINE ทุกครั้ง

## 12. การตั้งค่า LIFF

### 12.1 ฝั่ง LINE Developers Console
1. สร้าง LINE Login channel → Add LIFF app 1 ตัว
2. **Endpoint URL = root ของโดเมน** เช่น `https://hr.yourcompany.com/`
3. Scope: เลือก `openid` + `profile`
4. Size: **Full** (หรือ Tall)
5. Rich Menu ของ LINE OA ตั้งปุ่มเป็น type "link" — เลือกได้ 2 แบบ:

**แบบ A — path ตรง (มาตรฐานตามเอกสาร LINE):**
- ลงเวลา → `https://liff.line.me/{liffId}/attendance`
- ยื่นลา → `https://liff.line.me/{liffId}/leave`
- สลิปเงินเดือน → `https://liff.line.me/{liffId}/payroll`

**แบบ B — query parameter (ทนทานกว่า แนะนำ):**
- ลงเวลา → `https://liff.line.me/{liffId}?target=attendance`
- ยื่นลา → `https://liff.line.me/{liffId}?target=leave`
- สลิปเงินเดือน → `https://liff.line.me/{liffId}?target=payroll`

แล้วดักอ่านที่หน้าแรก (หลัง LiffGate ปล่อยผ่านแล้วเท่านั้น):

```tsx
// ใน HomePage หรือ component แรกหลัง LiffGate
const [searchParams] = useSearchParams();
const navigate = useNavigate();

useEffect(() => {
  const target = searchParams.get('target');
  if (target && ['attendance', 'leave', 'payroll'].includes(target)) {
    navigate(`/${target}`, { replace: true });
  }
}, []);
```

**เหตุผลและเงื่อนไข (ตรวจสอบกับเอกสาร LINE แล้ว):**
- เอกสาร LIFF ระบุว่า `liff.init()` ประมวลผลจาก `liff.state` และ **กระบวนการที่เปลี่ยน URL ต้องรอให้ `liff.init()` resolve ก่อน** อีกทั้ง init รับประกันเฉพาะ URL ที่ตรง/อยู่ใต้ Endpoint URL — ถ้า router เข้าจัดการ path ก่อน SDK ถอด `liff.state` เสร็จ อาจเจอหน้าขาว/routing เพี้ยน (เป็นเรื่อง timing เกิดได้ทุก platform โดยมีรายงานบน iOS WebView บ่อยกว่า)
- **การป้องกันหลักคือ `LiffGate`** (12.2) — render router หลัง init resolve เสมอ ห้าม render ก่อน
- แบบ B ทนทานกว่าเพราะแอปตกที่ root เสมอ กรณีเลวร้ายสุดผู้ใช้แค่ค้างที่หน้า Home ไม่ใช่จอขาว/404 — ใช้ทั้ง LiffGate + แบบ B ร่วมกันเป็น defense-in-depth
- ถ้าใช้แบบ A ให้ทดสอบบนอุปกรณ์จริงทั้ง iOS และ Android ก่อนขึ้น production เสมอ

### 12.2 ฝั่งโค้ด — LiffProvider + useLiff (React 19)

```tsx
// src/lib/liff/LiffProvider.tsx
import liff from '@line/liff';
import { createContext, useContext, useEffect, useState } from 'react';

type LiffState = { liff: typeof liff; isReady: boolean; error: Error | null };
const LiffContext = createContext<LiffState>(null!);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    liff
      .init({ liffId: import.meta.env.VITE_LIFF_ID })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login(); // ใน external browser จะ redirect ไปหน้า LINE Login
          return;
        }
        setIsReady(true);
      })
      .catch((e) => setError(e as Error));
  }, []);

  return (
    <LiffContext.Provider value={{ liff, isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => useContext(LiffContext);
```

> **หมายเหตุ React 19:** ใช้ `<LiffContext value={{...}}>` แทน `<LiffContext.Provider value={{...}}>` ได้โดยตรง (syntax ใหม่ของ React 19 — แบบ `.Provider` ยังใช้ได้เหมือนเดิม ไม่พังของเก่า) และ `@line/liff` เป็น vanilla JS library ไม่มี peer dependency กับ React จึงไม่มีปัญหากับ React 19

```tsx
// src/app/providers.tsx — LIFF ต้อง ready ก่อน render ส่วนอื่น
export function Providers() {
  return (
    <LiffProvider>
      <LiffGate>  {/* แสดง loading จนกว่า isReady; error state ถ้า init ล้มเหลว */}
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </LiffGate>
    </LiffProvider>
  );
}
```

```tsx
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/attendance', element: <AttendancePage /> },
  { path: '/leave', element: <LeavePage /> },
  { path: '/payroll', element: <PayrollPage /> },
]);
```

### 12.3 Routing Map รวม (ทุก route ในแอป)

| Route | หน้า (จาก feature plans) | เข้าจาก |
|---|---|---|
| `/` | Home (ดักอ่าน `?target=` แล้ว redirect) | เปิด LIFF ตรง |
| `/register` → `/register/otp` → `/register/success` | ลงทะเบียน + OTP + สำเร็จ (plan 01) | auth ตอบ `NEED_REGISTER` |
| `/attendance` | ClockPage (state machine — plan 02) | Rich Menu `?target=attendance` |
| `/attendance/history` | ประวัติลงเวลา | ปุ่มใน dock |
| `/leave` | LeaveShellPage — segment การลาของฉัน\|รออนุมัติลา (plans 03+04) | Rich Menu `?target=leave` |
| `/leave/new` | ฟอร์มยื่นลา | ปุ่ม + ใน balance |
| `/leave/:id` | รายละเอียดใบลา (owner-view) | กดการ์ดใน list |
| `/approval/:id` | รายละเอียดฝั่งหัวหน้า (approver modes) | กด "ตรวจสอบ" ใน segment รออนุมัติ |
| `/payroll` | รายการสลิป (plan 05) | Rich Menu `?target=payroll` |
| `/payroll/:id` | รายละเอียดสลิป | กดการ์ดเดือน |
| `/calendar` | CalendarShellPage — segment ปฏิทินการลา\|วันหยุด (plan 06) | Rich Menu `?target=calendar` |

> อย่าลืมเพิ่ม `'calendar'` ใน whitelist ของโค้ดดัก `?target=` (12.1) และเพิ่มปุ่ม "ดูวันหยุด" ใน Rich Menu — design มีกลุ่ม Calendar เป็นทางเข้าของตัวเอง

## 13. Session, Register และการ Verify token ฝั่ง Backend

### 13.1 Session ต่อการเปิดจาก Rich Menu — ต้อง auth ใหม่ทุกครั้ง (แบบเงียบ)

การ auth มี 2 ชั้นที่คนละเรื่องกัน:

| ชั้น | ต้องทำใหม่ไหมเมื่อเปิดจาก Rich Menu | เหตุผล |
|---|---|---|
| **LINE login** | ไม่ต้อง | ผู้ใช้ login LINE ค้างในแอป LINE อยู่แล้ว `liff.init()` → `isLoggedIn()` เป็น true ทันที ไม่มีหน้า login โผล่ |
| **Session ของแอปเรา (JWT)** | ต้องทำใหม่ทุกครั้ง | Zustand เก็บใน memory ปิดหน้าต่าง LIFF แล้วหายหมด |

Flow ทุกครั้งที่เปิด:

```
กด Rich Menu → liff.init() → getIDToken()
→ POST /auth/login {idToken}
→ server verify กับ LINE → ได้ JWT
→ เก็บใน Zustand → ใช้งานต่อ
```

ต้นทุนคือ round trip เพิ่ม 1 ครั้งตอนเปิดแอป (หลักร้อย ms) ซ่อนอยู่หลังจอ loading ของ `liff.init()` — **แนะนำให้ยอมรับ flow นี้ตรง ๆ** เรียบง่ายและปลอดภัยสุดสำหรับข้อมูลเงินเดือน

**ทางเลือกลด round trip:** persist JWT ลง `localStorage` (Zustand มี `persist` middleware) เปิดใหม่เช็กก่อนว่ามี JWT ที่ยังไม่หมดอายุไหม ถ้ามีข้ามขั้น verify — trade-off คือ token ค้างในเครื่อง (เสี่ยง XSS มากขึ้น) ถ้าใช้แนวนี้ตั้งอายุ JWT สั้น เช่น 1-4 ชั่วโมง

### 13.2 Register ครั้งเดียว หลังจากนั้นกดใช้ได้ยาว ๆ

ระบบมี 2 กระบวนการแยกกัน:
- **Register (ผูกบัญชี)** — ทำครั้งเดียว: สร้างความเชื่อมโยง `LINE userId (sub) ↔ รหัสพนักงาน` ในฐานข้อมูล
- **Authentication** — เกิดทุกครั้งที่เปิด แต่เงียบและอัตโนมัติ (ตาม 13.1)

```
POST /auth/login {idToken} → server verify → ได้ sub

server เช็ก: sub นี้ผูกกับพนักงานหรือยัง?
│
├─ ยังไม่ผูก (ครั้งแรก)
│    → ตอบ "ต้อง register"
│    → frontend พาไปหน้า register
│    → ผูกสำเร็จ → ออก JWT → ใช้งานได้
│
└─ ผูกแล้ว (ครั้งที่ 2 เป็นต้นไป)
     → ออก JWT ทันที → เข้าหน้าที่กดมาเลย
```

**ข้อควรระวังในการออกแบบ register:**
1. **ห้ามให้ผูกกันเองแบบเสรี** — ถ้าแค่กรอกรหัสพนักงานก็ผูกได้ ใครที่รู้รหัสพนักงานคนอื่นจะผูก LINE ตัวเองแล้วเปิดดูสลิปเขาได้ ต้องมีการพิสูจน์ตัวจริงอย่างน้อยหนึ่งชั้น เช่น รหัสพนักงาน + ข้อมูลที่คนนอกไม่รู้ (วันเกิด/เลขท้ายบัตร), invite code ใช้ครั้งเดียวที่ HR แจกรายคน, หรือให้ HR กดอนุมัติการผูกก่อนใช้งาน
2. **เผื่อกรณีความผูกพันเปลี่ยน** — พนักงานเปลี่ยนบัญชี LINE (userId เปลี่ยน) ต้องมีช่องทางให้ admin ปลดการผูกเดิมแล้ว register ใหม่; พนักงานลาออก → ปิด mapping ทันที
3. LINE userId ของคนเดิมใน provider เดิม **คงที่เสมอ** ไม่สุ่มใหม่ ตราบใดที่ไม่เปลี่ยนบัญชี LINE

### 13.3 Handle กรณี ID token หมดอายุ

ID token ถูกออก **ตอนเกิด LIFF login** แล้ว SDK แคชไว้ — `liff.getIDToken()` เป็นแค่การหยิบของที่แคชมาให้ **SDK ไม่ต่ออายุให้อัตโนมัติ** ถ้า session ค้างนาน (มักเจอใน external browser หรือหน้าค้างข้ามชั่วโมง) จะได้ token ใบเดิมที่หมดอายุแล้ว server verify จะ reject

วิธีแก้: บังคับออก token ใบใหม่ด้วยการทำ LIFF login รอบใหม่
- `liff.logout()` — ล้างเฉพาะ session ของ LIFF app (token ที่แคช) **ผู้ใช้ยัง login LINE อยู่เหมือนเดิม** ไม่โดนเตะออกจากแอป LINE
- `liff.login()` — ขอ token ชุดใหม่ ผ่านอัตโนมัติเพราะ LINE session มีอยู่แล้ว (ทำงานแบบ redirect ทั้งหน้า → หน้าโหลดใหม่ → `liff.init()` อีกรอบ → ได้ token สด)

```tsx
async function loginToBackend() {
  const idToken = liff.getIDToken();
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (res.status === 401) {
    const { code } = await res.json();
    if (code === 'ID_TOKEN_EXPIRED') {
      liff.logout();  // ฉีกตั๋วเก่าทิ้ง (ไม่กระทบ LINE login)
      liff.login();   // ขอตั๋วใหม่ — redirect แล้วกลับมาพร้อม token สด
      return;         // โค้ดหลังจากนี้ไม่รัน เพราะหน้าถูก reload
    }
  }
  return res.json(); // ได้ JWT ของระบบเรา
}
```

Backend ควรตอบ error code ที่แยกแยะได้ (เช่น `ID_TOKEN_EXPIRED`) เพื่อให้ frontend รู้ว่าเคสนี้ต้อง re-login ไม่ใช่ error อื่น — เคสนี้เจอน้อยเมื่อเปิดผ่าน Rich Menu ใน LINE app แต่ควรเขียน handler กันไว้

### 13.4 Backend verify ID token กับ LINE — วิธีมาตรฐาน

วิธีตายตัวที่ LINE กำหนดคือเรียก endpoint เดียว:

```
POST https://api.line.me/oauth2/v2.1/verify
Content-Type: application/x-www-form-urlencoded
```

| พารามิเตอร์ | จำเป็น | ค่า |
|---|---|---|
| `id_token` | ✅ | ID token ที่ได้จาก `liff.getIDToken()` |
| `client_id` | ✅ | **Channel ID ของ LINE Login channel** (ตัวเดียวกับที่สร้าง LIFF app) เก็บใน env ฝั่ง server เท่านั้น |
| `nonce` | ถ้ามี | ใช้เมื่อตั้ง nonce ตอน login (กัน replay) |
| `user_id` | ถ้ามี | ใช้เมื่ออยากให้ LINE ตรวจเพิ่มว่า token เป็นของ user นี้ |

**Response กรณีสำเร็จ (HTTP 200):** LINE ตรวจ signature, `iss`, `aud`, `exp` ให้เสร็จสรรพ แล้วคืน payload:

```json
{
  "iss": "https://access.line.me",
  "sub": "U1234567890abcdef...",   // LINE userId ที่เชื่อถือได้ ← ใช้ตัวนี้
  "aud": "1234567890",              // ต้องตรงกับ channel ID ของเรา
  "exp": 1735689600,
  "iat": 1735686000,
  "name": "สมชาย",
  "picture": "https://profile.line-scdn.net/..."
}
```

**Response กรณีล้มเหลว (HTTP 400):** ได้ `error` + `error_description` เช่น token หมดอายุจะได้ description ทำนอง "IdToken expired" — ใช้แยกเคสเพื่อตอบ `ID_TOKEN_EXPIRED` กลับ frontend (ตาม 13.3)

**ตัวอย่างเต็มฝั่ง backend (Node + Express):**

```js
// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ code: 'MISSING_TOKEN' });

  // 1) verify กับ LINE
  const params = new URLSearchParams();
  params.append('id_token', idToken);
  params.append('client_id', process.env.LINE_LOGIN_CHANNEL_ID);

  let payload;
  try {
    const r = await axios.post(
      'https://api.line.me/oauth2/v2.1/verify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    payload = r.data;
  } catch (e) {
    const desc = e.response?.data?.error_description ?? '';
    if (desc.toLowerCase().includes('expired')) {
      return res.status(401).json({ code: 'ID_TOKEN_EXPIRED' });
    }
    return res.status(401).json({ code: 'INVALID_TOKEN' });
  }

  // 2) กันพลาด: ตรวจ aud ซ้ำอีกชั้น
  if (String(payload.aud) !== process.env.LINE_LOGIN_CHANNEL_ID) {
    return res.status(401).json({ code: 'INVALID_TOKEN' });
  }

  // 3) map sub → พนักงาน
  const employee = await db.employee.findByLineUserId(payload.sub);
  if (!employee) {
    return res.status(200).json({ code: 'NEED_REGISTER' }); // ครั้งแรก → ไปหน้า register
  }
  if (!employee.active) {
    return res.status(403).json({ code: 'EMPLOYEE_INACTIVE' }); // ลาออก/ถูกระงับ
  }

  // 4) ออก JWT ของระบบเรา (อายุสั้น)
  const token = jwt.sign(
    { employeeId: employee.id },
    process.env.JWT_SECRET,
    { expiresIn: '4h' }
  );

  await auditLog.write({ employeeId: employee.id, action: 'LOGIN', ip: req.ip });
  return res.json({ token, employee: { id: employee.id, name: employee.name } });
});
```

**Checklist ฝั่ง verify:**
- [ ] เรียก `POST /oauth2/v2.1/verify` เสมอ — ห้าม decode JWT เองเฉย ๆ โดยไม่ตรวจ signature
- [ ] `client_id` เก็บใน env ฝั่ง server เท่านั้น
- [ ] ตรวจ `aud` ตรงกับ channel ID ของเรา
- [ ] แยก error expired ออกจาก invalid เพื่อให้ frontend re-login ถูกเคส
- [ ] ใช้เฉพาะ `sub` จาก response ในการ map พนักงาน — ห้ามใช้ userId ที่ client ส่งมาเอง
- [ ] เช็กสถานะพนักงาน (active) ก่อนออก JWT

> ทางเลือกขั้นสูง: verify signature เองในเครื่องด้วย JWKS ของ LINE (`https://api.line.me/oauth2/v2.1/certs`) ผ่าน JWT library เช่น `jose` — ลด dependency กับ network call ไป LINE ทุกครั้ง แต่ต้องตรวจ `iss`, `aud`, `exp` เองให้ครบ สำหรับระบบขนาดนี้ใช้ verify endpoint ของ LINE ตรง ๆ ง่ายและปลอดภัยพอแล้ว

---

# ส่วน D — ความปลอดภัย, GPS และ Backend

## 14. ความปลอดภัย (สำคัญที่สุดสำหรับข้อมูลเงินเดือน)

**หลักการเดียวที่ห้ามลืม: ห้ามเชื่อค่าใด ๆ จาก frontend รวมถึง userId** — LINE ระบุชัดในเอกสารว่าห้ามส่ง profile ที่ได้จาก `liff.getProfile()` / `liff.getDecodedIDToken()` ไปใช้ที่ server เพราะปลอมได้ ให้เชื่อเฉพาะ token ที่ verify แล้วเท่านั้น

### Flow ยืนยันตัวตนที่ถูกต้อง (ID Token)

```
Frontend                          Backend                         LINE Platform
   │  liff.getIDToken()              │                                │
   │ ── POST /auth/login {idToken} ─▶│                                │
   │                                 │ ── POST /oauth2/v2.1/verify ──▶│
   │                                 │ ◀── { sub, name, picture } ────│
   │                                 │  map sub → รหัสพนักงาน          │
   │ ◀──── JWT ของระบบเราเอง ─────── │  ออก JWT (อายุสั้น)             │
   │  เก็บ JWT ใช้ทุก request ถัดไป   │                                │
```

1. Frontend: `const idToken = liff.getIDToken()`
2. ส่งไป backend ผ่าน HTTPS
3. Backend เรียก `POST https://api.line.me/oauth2/v2.1/verify` (Content-Type: `application/x-www-form-urlencoded`) พร้อม `id_token` และ `client_id` (= LINE Login channel ID)
4. ใช้ `sub` (LINE userId) **ที่ verify แล้ว** map ไปยังพนักงานในฐานข้อมูล
5. ออก **JWT ของระบบเอง** ให้ frontend (เพราะ LINE access token อายุ 12 ชม. และอาจถูก revoke เมื่อปิด LIFF)
6. ทุก endpoint หลังจากนั้นตรวจ JWT ของเรา + ตรวจสิทธิ์ว่าพนักงานคนนั้นดูได้เฉพาะข้อมูลของตัวเอง

```js
// ตัวอย่าง verify ฝั่ง backend (Node)
const params = new URLSearchParams();
params.append('id_token', idToken);
params.append('client_id', process.env.LINE_LOGIN_CHANNEL_ID);
const { data } = await axios.post(
  'https://api.line.me/oauth2/v2.1/verify',
  params,
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
// data.sub = userId ที่เชื่อถือได้
```

### Checklist ความปลอดภัยเพิ่มเติม
- [ ] Payslip endpoint ตรวจสิทธิ์รายบุคคล (พนักงาน A ห้ามดูสลิปพนักงาน B)
- [ ] Validate ทุก input ด้วย Zod schema ทั้ง client และ **server** (server ห้าม skip)
- [ ] เก็บ `LINE_LOGIN_CHANNEL_ID` และ JWT secret ที่ backend เท่านั้น
- [ ] Audit log ทุกการเปิดดูสลิป / ลงเวลา / ยื่นลา
- [ ] Timestamp การลงเวลาใช้เวลาฝั่ง server ไม่ใช่เวลาจากเครื่องผู้ใช้
- [ ] HTTPS ทุกเส้นทาง (LIFF บังคับอยู่แล้ว)

## 15. GPS สำหรับลงเวลา (Clock-in / Clock-out)

LIFF ไม่มี geolocation API ของตัวเอง — ใช้ HTML5 `navigator.geolocation` มาตรฐาน และตามกฎ LIFF **ต้องเรียกจาก user action (กดปุ่ม) เท่านั้น** ห้ามเรียกตอน page load

```tsx
// src/features/attendance/hooks/useGeolocation.ts
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('อุปกรณ์ไม่รองรับ GPS'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0, // ตามสเปกเป็น default อยู่แล้ว แต่ใส่ explicit
                     // กัน WebView บางตัว implement เพี้ยนแล้วคืนพิกัด cache เก่า
    });
  });
}

// Defensive: บน LINE Android WebView มีรายงานอาการ timeout บ่อย
// → retry รอบสองแบบลดความแม่นยำ (fix สัญญาณเร็วกว่า) ก่อนแจ้งผู้ใช้
export async function getPositionWithRetry(): Promise<GeolocationPosition> {
  try {
    return await getCurrentPosition();
  } catch (e) {
    const err = e as GeolocationPositionError;
    if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
      return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // รอบสอง: ยอมแม่นน้อยลงเพื่อให้ได้พิกัด
          timeout: 15000,
          maximumAge: 0,
        })
      );
    }
    throw e; // PERMISSION_DENIED → แจ้งวิธีเปิดสิทธิ์ ไม่ต้อง retry
  }
}
```

**แยกข้อความแจ้งผู้ใช้ตาม error code:**

| code | สาเหตุ | ควรแจ้งว่า |
|---|---|---|
| `PERMISSION_DENIED` | ผู้ใช้ปฏิเสธสิทธิ์ | แนะนำวิธีเปิดสิทธิ์ตำแหน่งให้แอป LINE ใน Settings |
| `POSITION_UNAVAILABLE` | หา fix ไม่ได้ (อยู่ในอาคาร/GPS ปิด) | ให้ลองขยับใกล้หน้าต่าง/เปิด Location แล้วกดใหม่ |
| `TIMEOUT` | สัญญาณช้า (พบบ่อยบน Android WebView) | ระบบ retry ให้อัตโนมัติแล้ว ถ้ายังไม่ได้ให้กดลงเวลาซ้ำ |

```tsx
// เรียกจาก onClick ของปุ่ม "ลงเวลาเข้างาน" (user action) เท่านั้น — ตามกฎ LIFF
async function handleClockIn() {
  const pos = await getPositionWithRetry();
  await clockIn({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy, // ส่งไปเก็บ audit log ใช้ดู pattern ผิดปกติ
  });
}
```

**กติกาฝั่ง backend:**
- ตรวจ **geofence ที่ server** — คำนวณระยะ Haversine ระหว่างพิกัดที่ส่งมากับพิกัดสถานที่ทำงาน เทียบกับรัศมีที่ตั้งไว้ ห้ามให้ frontend เป็นคนตัดสิน
- ตั้งรัศมีเผื่อ (เช่น 100-200 ม.) เพราะความแม่นยำ GPS ผ่าน browser ต่ำกว่า native app
- เก็บพิกัดจริง + ผลตรวจ + server timestamp ลง audit log ทุกครั้ง
- (Option ป้องกันฝากลงเวลา) เพิ่มถ่าย selfie ประกอบ — เป็นแพทเทิร์นที่ระบบ HR ไทยเชิงพาณิชย์ใช้กัน

**UX:** แสดงสถานะขอ permission ชัดเจน, มี fallback message เมื่อผู้ใช้ปฏิเสธ GPS, แสดงผล "ลงเวลาสำเร็จ HH:mm ที่ [สาขา]" แล้วอาจเรียก `liff.closeWindow()` (เช็ก `liff.isInClient()` ก่อน)

**UX เมื่อสัญญาณ GPS แย่ (พบบ่อยในอาคารสูง/ใต้ดินบน WebView ของ LINE):** ถ้า `accuracy` ที่ได้แย่เกินเกณฑ์ — แนะนำเกณฑ์ = มากกว่ารัศมี geofence ของสาขา หรือ > 100 ม. — อย่าปล่อยให้กดยืนยันเงียบ ๆ ให้แจ้งเตือนว่า "สัญญาณตำแหน่งไม่แม่นยำ กรุณาขยับใกล้หน้าต่าง/ที่โล่ง แล้วกดโหลดแผนที่ใหม่" พร้อมแสดงค่าความคลาดเคลื่อนโดยประมาณ — เหตุผล: พิกัดที่ accuracy แย่อาจ "หลุดออกนอกรัศมี" ทั้งที่พนักงานยืนในออฟฟิศ ทำให้ลงเวลาไม่ได้แบบงง ๆ การเตือนก่อนช่วยลดทั้ง ticket และการเผลอกดไป remote clock โดยไม่จำเป็น (server ยังเก็บ `accuracy` ลง audit log ทุกครั้งตามเดิม และเป็นผู้ตัดสิน geofence สุดท้ายเสมอ)

**กติกาการใช้แผนที่ (คุมโควตา map loads — สำคัญถ้าใช้ Google Maps):** ผู้ให้บริการแผนที่เชิงพาณิชย์นับโควตาเป็น "map load" **ต่อการ init แผนที่หนึ่งครั้ง** (ตอนสร้าง map instance ตอนเปิดหน้า) — ไม่นับการ pan/zoom/ขยับหมุดบนแผนที่เดิม ดังนั้น:
- **ปุ่ม "โหลดแผนที่ใหม่" ใน design ห้าม implement เป็นการ init แผนที่ใหม่** — ให้ทำเป็น: ขอ GPS รอบใหม่ (`getPositionWithRetry`) → อัปเดตตำแหน่งหมุดผู้ใช้ + `map.panTo()` บน instance เดิม
- สร้าง map instance **ครั้งเดียวต่อการเปิดหน้า** (useRef/useEffect mount เดียว) — ระวัง React re-render ทำให้ init ซ้ำโดยไม่ตั้งใจ ซึ่งเผาโควตาเงียบ ๆ
- การเปลี่ยน state ของหน้า (in-range ↔ out-of-range ↔ remote) เปลี่ยนแค่ pill/ปุ่ม/หมุด ไม่ re-init แผนที่
- ตัวเลขคำนวณโควตา (§23.2) ตั้งอยู่บนสมมติฐาน "เปิดหน้า = 1 load" — ถ้าพนักงานเปิด ๆ ปิด ๆ LIFF หลายรอบ/วัน ตัวเลขจริงจะสูงกว่าที่คำนวณ ควรดู usage dashboard ของ provider หลังขึ้นใช้จริงเดือนแรก

## 16. API Contract และแนวทาง Backend (Java EE)

### 16.1 มาตรฐาน Response/Error Format (สัญญากลางระหว่าง frontend ↔ backend)

```json
// สำเร็จ (HTTP 200)
{ "data": { ... } }

// ล้มเหลว (HTTP 4xx/5xx)
{ "error": { "code": "ID_TOKEN_EXPIRED", "message": "โทเคนหมดอายุ กรุณาเข้าใหม่" } }
```

- `code` = machine-readable ให้ frontend ตัดสินใจ (switch/if) — **ห้ามเปลี่ยนค่าโดยไม่แจ้ง** ถือเป็น breaking change
- `message` = ภาษาไทย แสดงผู้ใช้ได้ทันที
- ฝั่ง frontend เขียน interceptor ใน `lib/api-client.ts` ครั้งเดียว: แกะ `data` อัตโนมัติ, โยน `ApiError { code, message }` ให้ TanStack Query, ดัก code กลางที่จุดเดียว:

```ts
// lib/api-client.ts (แนวคิด)
export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

// ดัก code กลาง: ID_TOKEN_EXPIRED → re-login (13.3),
// UNAUTHORIZED → ล้าง session, EMPLOYEE_INACTIVE → หน้าแจ้งติดต่อ HR
// code เฉพาะงาน (QUOTA_EXCEEDED, OUT_OF_GEOFENCE, ...) ให้ feature จัดการเอง
```

### 16.2 ตาราง Error Codes กลาง

| code | HTTP | ความหมาย | ใครจัดการ |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | input ไม่ผ่าน validation | feature (โชว์ที่ฟอร์ม) |
| `MISSING_TOKEN` / `INVALID_TOKEN` | 401 | ไม่มี/token ปลอม | interceptor → ล้าง session |
| `ID_TOKEN_EXPIRED` | 401 | LINE ID token หมดอายุ | interceptor → re-login flow (13.3) |
| `UNAUTHORIZED` | 401 | JWT ระบบหมดอายุ/ใช้ไม่ได้ | interceptor → auth ใหม่ (13.1) |
| `FORBIDDEN` | 403 | role ไม่มีสิทธิ์ / ไม่ใช่ลูกทีม | interceptor → หน้าแจ้งไม่มีสิทธิ์ |
| `EMPLOYEE_INACTIVE` | 403 | พนักงานพ้นสภาพ/ถูกระงับ | interceptor → หน้าแจ้งติดต่อ HR |
| `NEED_REGISTER` | 200 | ยังไม่ผูกบัญชี | auth feature → พาไป register (13.2) |
| `OTP_INVALID` / `OTP_EXPIRED` / `OTP_RATE_LIMITED` | 400/429 | OTP ผิด/หมดอายุ/ขอถี่เกิน | register flow |
| `OUT_OF_GEOFENCE` | 422 | พิกัดนอกรัศมี (โหมด onsite) | attendance → เสนอ remote clock |
| `ALREADY_CLOCKED_IN` / `NOT_CLOCKED_IN` | 409 | ลงเวลาซ้ำ/ยังไม่ได้เข้า | attendance |
| `QUOTA_EXCEEDED` | 422 | วันลาคงเหลือไม่พอ (atomic check 7.4) | leave form |
| `REQUEST_NOT_PENDING` | 409 | ใบลาไม่อยู่สถานะ PENDING แล้ว (ยกเลิก/อนุมัติชนกัน) | leave/approval → refresh รายการ |
| `NETWORK_ERROR` | — | fetch ล้มโดยไม่มี response (สัญญาณวูบ) — **สร้างโดย interceptor ฝั่ง client** ไม่ใช่ backend | ErrorState/toast + ปุ่มลองใหม่ (20.3) |

### 16.3 API Contract — Endpoint ทั้งหมด (รวบจากทุกหัวข้อ)

ทุกเส้น (ยกเว้น auth) ต้องแนบ `Authorization: Bearer <JWT ระบบ>` — 🔒 = เฉพาะ `role: manager`

| Method + Path | ทำอะไร | หมายเหตุ |
|---|---|---|
| **auth** | | |
| `POST /auth/login` | `{idToken}` → `{token, employee}` หรือ `NEED_REGISTER` | 13.4 |
| `POST /auth/register/request-otp` | ขอ OTP ไปเบอร์ที่ลงทะเบียน | rate limit (3.4) |
| `POST /auth/register/verify-otp` | ยืนยัน OTP → ผูก `sub↔พนักงาน` → `{token, employee}` | audit log |
| **attendance** | | |
| `GET /attendance/today` | สถานะวันนี้ (เข้าแล้วหรือยัง, กะ, จุดทำงาน+รัศมี) | รัศมีใช้เช็ค UX ฝั่ง client |
| `POST /attendance/clock-in` | `{lat,lng,accuracy,type:'onsite'\|'remote',remoteReason?}` | server ประทับเวลา + geofence (15, 3.1) |
| `POST /attendance/clock-out` | โครงเดียวกับ clock-in | |
| `GET /attendance/history?month=` | ประวัติลงเวลาของตัวเอง | |
| **leave** | | |
| `GET /leave/types` | ประเภทลา + กติกา | cache ยาวได้ |
| `GET /leave/balance` | โควตาคงเหลือต่อประเภท | label "โดยประมาณ" (7.4) |
| `POST /leave/requests` | ยื่นใบลา (multipart รองรับไฟล์แนบ) | validate สองฝั่ง |
| `GET /leave/requests?status=&year=&month=` | ใบลาของฉัน (history + pending) | |
| `GET /leave/requests/{id}` | รายละเอียดใบลาของฉัน | เจ้าของเท่านั้น |
| `POST /leave/requests/{id}/cancel` | ยกเลิกใบที่ยัง PENDING | 3.2, `REQUEST_NOT_PENDING` |
| **calendar** | | |
| `GET /leave/calendar?month=` | จุดต่อวัน `[{date, types[]}]` | 10.3 ชั้นปฏิทิน |
| `GET /leave/calendar/{date}` | รายละเอียดคนลาวันนั้น | กรองตาม role/PDPA (10.3) |
| `GET /holidays?year=` | วันหยุดบริษัท/นักขัตฤกษ์ | 3.5 — ใช้ใน countLeaveDays ด้วย |
| **payroll** | | |
| `GET /payroll/payslips?year=` | รายการสลิปของตัวเอง | |
| `GET /payroll/payslips/{id}` | รายละเอียดสลิป | audit `PAYSLIP_VIEW` |
| `POST /payroll/payslips/{id}/email` | ส่งสลิปเข้าอีเมลที่ลงทะเบียน | **ห้ามรับอีเมลจาก client** (3.3) |
| **approval** 🔒 | | |
| `GET /approval/pending` | ใบลารออนุมัติของลูกทีม | 17.5 |
| `GET /approval/requests/{id}` | รายละเอียด (ใช้ทั้ง pending/history) | เช็ค `manager_id` |
| `POST /approval/requests/{id}/approve` | `{comment?}` — ตัดโควตา atomic | 7.4 |
| `POST /approval/requests/{id}/reject` | `{reason}` (บังคับ) | |
| `GET /approval/history?year=&month=` | ที่ตัวเองเคยอนุมัติ/ปฏิเสธ | |

> frontend เริ่มเขียน `features/*/api/` ตาม contract นี้ได้เลยโดย mock response ระหว่างรอ backend จริง

### 16.4 แนวทาง Backend เมื่อเป็น Java EE (Jakarta EE)

**Stack ที่เข้าชุด:** JAX-RS (REST) + JSON-B + CDI + **Bean Validation** (validate ฝั่ง server) + ออก JWT ด้วย jjwt/jose4j (หรือ MicroProfile JWT ถ้า app server รองรับ) — เรียก LINE verify endpoint (13.4) ผ่าน JAX-RS Client ปกติ ตัว flow ทั้งหมดในหัวข้อ 14/12 ใช้ได้เหมือนเดิม แค่เปลี่ยนภาษา

**ผลกระทบสำคัญจากการเลือก Java:** แชร์ **Zod schema ระหว่าง frontend-backend ไม่ได้แล้ว** (แผนเดิมหัวข้อ 14) — validation จะมีสองชุด (Zod ฝั่งฟอร์ม / Bean Validation ฝั่ง server) ซึ่งเสี่ยงหลุด sync ทางแก้ที่แนะนำ: ใช้ **OpenAPI เป็น single source of truth แทน**
1. ฝั่ง Java annotate JAX-RS ด้วย MicroProfile OpenAPI (หรือเขียน `openapi.yaml` มือจากตาราง 16.3)
2. ฝั่ง frontend generate TypeScript types จาก spec ด้วย `openapi-typescript` — type ของ request/response ตรงกับ server เสมอโดยไม่ต้อง copy มือ
3. Zod ยังใช้ที่ฟอร์ม (UX validation) แต่ "สัญญา" อยู่ที่ OpenAPI — เปลี่ยน contract ต้องแก้ spec ก่อน

**โครงสร้างขึ้นกับคำตอบ 17.4 (decision tree):**
- ระบบเดิมมี API → Java backend ตัวนี้เป็น **thin BFF**: verify LINE token → map ตัวตน → เรียก API ระบบเดิม → ประกอบ response ให้พอดีหน้าจอ LIFF
- ต้องต่อ DB เดียวกับระบบเดิม → เป็น service เต็มตัวแชร์ DB — ต้องตกลง **schema ownership** ให้ชัด (ตารางเดิมระบบเดิมเป็นเจ้าของ ห้ามแก้ schema เอง / ตารางใหม่ของ LIFF เช่น line_account_mapping, attendance_record แยก prefix/schema ของตัวเอง)
- Java EE ยังเข้าทางถ้าคำตอบ 23.2 ออกมาเป็น on-premise/infra ภาครัฐ (app server อย่าง WildFly/Payara คุ้นเคยกับสภาพแวดล้อมแบบนั้นอยู่แล้ว)

---

# ส่วน E — Role หัวหน้าทีมและ Approval

## 17. Role หัวหน้าทีม และ Feature "อนุมัติ"

### 17.1 โมเดลสิทธิ์ (เคาะแล้ว)

- ผู้อนุมัติคือ **หัวหน้าทีม** ไม่ใช่ HR — หัวหน้าเป็นพนักงานคนหนึ่ง มีทุกอย่างเหมือนพนักงานปกติ (ลงเวลา, ยื่นลา, ดูสลิปตัวเอง)
- สิ่งที่หัวหน้าได้เพิ่มมี 2 เมนู: **"อนุมัติ"** (รายการใบลารออนุมัติของลูกทีม) และ **"ประวัติการอนุมัติ"** (ที่ตัวเองเคยอนุมัติ/ปฏิเสธ — query จาก leave_request เดิม filter `approved_by = ตัวเอง` ไม่ต้องมีตารางใหม่)
- **ไม่สร้างเว็บ admin ใหม่** — องค์กรมีเว็บ admin เดิมอยู่แล้ว โปรเจกต์ LIFF นี้เป็นส่วนขยายบน LINE OA (ดู 17.4)

### 17.2 โครงสร้าง — เพิ่มเป็น feature ที่ 5 ตามกติกาเดิม

```
features/approval/
├── api/         # getPendingRequests(), approveLeave(),
│                # rejectLeave(), getApprovalHistory()
├── components/  # PendingLeaveList, ApprovalHistoryList,
│                # ApprovalActionSheet (Drawer อนุมัติ/ไม่อนุมัติ + เหตุผล)
├── hooks/       # usePendingRequests(), useApproveLeave(),
│                # useApprovalHistory()
└── index.ts
```

**ข้อมูลที่ต้องเพิ่ม:** ตาราง employee เพิ่ม `role` (`employee` | `manager`) และ `team_id` / `manager_id` (รู้ว่าใครอนุมัติใบลาของใคร) — ตอน backend ออก JWT (หัวข้อ 13.4) ฝัง `role` ลง payload ด้วย

### 17.3 กติกาสิทธิ์

- Frontend: BottomNav/Home แสดงเมนู "อนุมัติ" + badge จำนวนค้าง เฉพาะเมื่อ `role === 'manager'` — เป็นแค่ UX
- **ตัวกันจริงคือ backend**: ทุก endpoint ของ approval เช็ค role จาก JWT + เช็คว่าใบลานั้นเป็นของลูกทีมตัวเองจริง ไม่ผ่าน → 403 เสมอ (ใครยิง API ตรงโดยไม่มีสิทธิ์ต้องไม่ได้อะไร)
- **สลิปเงินเดือนลูกทีม หัวหน้าไม่เห็นเด็ดขาด** ไม่ว่ากรณีไหน

### 17.4 Integration กับระบบ admin เดิม (ต้องเคาะก่อนออกแบบ backend)

ข้อมูลต้นทาง (พนักงาน, สายบังคับบัญชา, โควตาลา, สลิป) อยู่ที่ระบบเดิม — backend ของ LIFF ต้อง**อ่านจากแหล่งเดียวกัน ห้ามสร้างฐานข้อมูลพนักงานซ้ำ** (สองชุดเมื่อไหร่ ข้อมูลไม่ตรงกันเมื่อนั้น) ทางเชื่อมมี 2 แบบ รอเคาะตามเงื่อนไขว่าคุมโค้ดระบบเดิมได้แค่ไหน:
- (ก) ระบบเดิมมี API → backend LIFF เป็นตัวกลางเรียกต่อ
- (ข) ต่อ database เดียวกันโดยตรง

ต้องรู้คำตอบก่อนเขียน `/auth/login` เพราะขั้น map `sub → พนักงาน` (13.4) ต้องชี้ไปที่ข้อมูลพนักงานของจริง

> 📌 คำถามรอเคาะของหัวข้อนี้ถูกย้ายไปรวมไว้ที่หัวข้อ 23 (Open Questions)

### 17.5 รายละเอียด Feature Approval จาก design (SME-PAYROLL กลุ่ม 4)

**หน้าจอทั้งหมด 4 หน้า + 2 success state:**

| หน้า | Component หลัก | ข้อมูลที่ใช้ |
|---|---|---|
| Pending List | `PendingLeaveList` (การ์ดต่อใบ: รูป+ชื่อ, badge ประเภท, ช่วงวัน, จำนวนวัน) | `GET /approval/pending` |
| Pending Details | `ApprovalDetail` + ปุ่มอนุมัติ/ปฏิเสธ (ปฏิเสธต้องกรอกเหตุผล) | `GET /approval/requests/:id` |
| Approve/Reject Success | success state + กลับรายการ | `POST /approval/requests/:id/approve` หรือ `/reject { reason }` |
| History | `ApprovalHistoryList` (badge สถานะ อนุมัติ/ปฏิเสธ) | `GET /approval/history` |
| History Details | `ApprovalDetail` โหมด read-only | `GET /approval/requests/:id` |

**กติกา endpoint:** ทุกเส้นเช็ค `role === 'manager'` จาก JWT + ใบลาต้องเป็นของลูกทีมตัวเอง (`manager_id = ตัวเอง`) ไม่ผ่าน → 403; หลัง approve/reject → invalidate query `pending` + `history` และตัดโควตาแบบ atomic (7.4)

---

# ส่วน F — Environment และ Workflow การพัฒนา

## 18. Environment & Deployment

### 18.1 โครง 3 Environments (เคาะแล้ว: dev บน Vercel / UAT, PRD รอข้อมูล infra)

| | DEV | UAT | PRD |
|---|---|---|---|
| ใช้ทำอะไร | ทีม dev ทดสอบระหว่างพัฒนา | ให้ผู้ใช้/ฝ่ายธุรกิจทดสอบรับงาน | ใช้งานจริง |
| Hosting | **Vercel** (เคาะแล้ว) | ⏳ รอเคาะ (23.2) | ⏳ รอเคาะ (23.2) |
| Domain | `<project>.vercel.app` (โดเมนหลักของ Vercel project — **ห้ามใช้ preview URL** ดู 18.2) | ⏳ | ⏳ |
| LIFF app | LIFF ID #1 → endpoint ชี้ Vercel | LIFF ID #2 | LIFF ID #3 |
| LINE Login channel | channel DEV | channel UAT | channel PRD |
| Backend + DB | dev | uat | prd |

**กติกาสำคัญ (ใช้ได้เลยไม่ต้องรอ infra):**
1. **Endpoint URL ผูกกับ LIFF app แบบ 1:1** → กี่ environment = LIFF ID เท่านั้นชุด สร้างครบ 3 ตัวตั้งแต่แรก
2. **แยก LINE Login channel ต่อ environment ไม่ใช่แค่แยก LIFF ID** — ขั้น verify token (13.4) ใช้ `client_id` = channel ID ถ้าใช้ channel เดียวกัน token ฝั่ง dev จะ verify ผ่านบน backend prd ได้ (ข้าม environment โดยไม่ตั้งใจ)
3. ทุก channel อยู่ใต้ **provider เดียวกัน** — LINE userId ผูกกับ provider ทำให้ userId เป็นค่าเดิมทุก env ทดสอบสะดวก
4. **Rich Menu ทดสอบห้ามแตะ OA จริง** — ทีมทดสอบผ่าน LIFF URL ตรง (`https://liff.line.me/{dev-liff-id}?target=...` ส่งในกลุ่ม LINE ทีม) หรือสร้าง OA ทดสอบแยก

### 18.2 ข้อควรระวังเฉพาะ Vercel (DEV)

- **LIFF Endpoint URL ต้องเป็นโดเมนคงที่** — Vercel สร้าง preview URL ใหม่ทุก deploy/branch (`<hash>.vercel.app`) ซึ่งใช้เป็น endpoint ไม่ได้เพราะ endpoint แก้ไม่ทันทุก deploy → ชี้ endpoint ไปที่**โดเมนหลักของ project** (deploy จาก branch `dev` เป็น production ของ Vercel project นั้น) เท่านั้น
- **SPA rewrite** — ใช้ BrowserRouter ต้องให้ทุก path ตอบ `index.html`:

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### 18.3 Vite env files ต่อ environment

```
.env.development   # npm run dev (local): VITE_LIFF_ID=<dev>, VITE_API_URL=http://localhost:xxxx
.env.dev           # vite build --mode dev  → deploy Vercel: VITE_LIFF_ID=<dev>, VITE_API_URL=<api dev>
.env.uat           # vite build --mode uat:  VITE_LIFF_ID=<uat>, VITE_API_URL=<api uat>
.env.production    # vite build:             VITE_LIFF_ID=<prd>, VITE_API_URL=<api prd>
```

- Frontend env มีได้เฉพาะของ public (`VITE_LIFF_ID`, `VITE_API_URL`) — channel ID, JWT secret, SMS provider key อยู่ env ของ **backend** แยกต่อ environment เช่นกัน (กฎเดิมหัวข้อ 14)
- local dev ใช้ LIFF ID ของ DEV ร่วมกับ `@line/liff-mock` ได้ (จะลงรายละเอียด workflow ในหัวข้อ 19)

> 📌 คำถาม infra ที่ต้องไปถามเพิ่ม ถูกย้ายไปรวมไว้ที่หัวข้อ 23 (Open Questions)

## 19. Local Dev Workflow — ทำงานบน localhost ได้ + เทสบน Vercel ได้ ระหว่าง dev

### 19.1 ภาพรวม: 2 โหมดแบ่งงานกัน

| งาน | ที่ไหน | เพราะ |
|---|---|---|
| เขียน UI/logic/ฟอร์ม (งาน ~90%) | **localhost** (liff-mock + MSW) | loop <1 วินาที (Vite HMR) + DevTools ครบ |
| Integration กับ backend dev | localhost (liff-mock, ปิด MSW ชี้ API จริง) | ยังได้ loop เร็ว |
| พฤติกรรม LINE/มือถือจริง (liff.state, GPS, safe-area, Drawer gesture) | **Vercel + LIFF DEV** | mock จำลอง in-app browser ไม่ได้ |
| ก่อน merge/release | Vercel บนเครื่องจริง iOS + Android | กติกา 12.1/10.2 |

**เหตุผลที่ localhost ต้องมี liff-mock:** `LiffGate` ไม่ปล่อย render จนกว่า `liff.init()` สำเร็จ — และ init บน `http://localhost` (ไม่อยู่ใต้ Endpoint URL) จะ fail แอปค้างจอ loading ตลอด → liff-mock (plugin ทางการของ LINE) คือกุญแจที่ทำให้ localhost มีชีวิต ต้นทุน ~5 บรรทัด | **MSW จำลอง "ข้อมูล"** (รอทีม Java) ส่วน **liff-mock จำลอง "สภาพแวดล้อม"** (localhost ไม่มีวันมี) — คนละเรื่องกัน backend เสร็จแล้วปิด MSW ได้ แต่ liff-mock ยังใช้ตลอดที่ dev บน localhost

### 19.2 Setup ฝั่ง localhost

**(1) liff-mock ใน LiffProvider:**

```tsx
// lib/liff/LiffProvider.tsx — เพิ่มก่อน liff.init()
if (import.meta.env.VITE_LIFF_MOCK === 'true') {
  const { LiffMockPlugin } = await import('@line/liff-mock');
  liff.use(new LiffMockPlugin());
}
await liff.init({
  liffId: import.meta.env.VITE_LIFF_ID,
  mock: import.meta.env.VITE_LIFF_MOCK === 'true',
});
```

`VITE_LIFF_MOCK=true` อยู่เฉพาะ `.env.development` — build จริง Vite ตัด dead code ทิ้ง ไม่มี mock ปน

**(2) MSW — mock API ตาม contract 16.3:**

```
src/mocks/
├── handlers/
│   ├── auth.ts        # POST /auth/login → { data: { token, employee } }
│   ├── attendance.ts
│   ├── leave.ts
│   ├── payroll.ts
│   └── approval.ts
└── browser.ts         # setupWorker(...handlers)
```

- เปิดเฉพาะเมื่อ `VITE_API_MOCK=true` (แยก flag จาก LIFF mock — จะได้สลับ "liff-mock + API จริง" ได้ตอน integrate กับ backend dev)
- MSW ดักที่ระดับ network → `api-client.ts` + TanStack Query ทำงานเหมือนของจริง **ไม่มี if-mock ในโค้ดแอป**
- response ใน handlers ต้องตามรูป `{ data }` / `{ error: { code, message } }` (16.1) — ใส่เคส error ด้วย (เช่น mock `QUOTA_EXCEEDED`) จะได้เขียน UI error ครบตั้งแต่ยังไม่มี backend

**(3) ทดสอบ GPS บนเครื่อง:** Chrome DevTools → More tools → **Sensors** → override พิกัด (ตั้งใน/นอกรัศมีสลับกันเพื่อดู UI ทั้งสองสถานะของหัวข้อ 3.1)

### 19.3 Setup ฝั่ง Vercel (เทสใน LINE จริงระหว่าง dev)

1. Vercel project ต่อกับ repo, ตั้ง **branch `dev` เป็น production branch** ของ project → push `dev` = deploy อัตโนมัติที่โดเมนคงที่ `<project>.vercel.app` (~1-2 นาที)
2. LIFF DEV (LIFF ID #1 จาก 18.1) ตั้ง Endpoint URL = โดเมนนั้น (**ห้ามใช้ preview URL** — 18.2)
3. ตั้ง env บน Vercel: `VITE_LIFF_ID=<dev>`, `VITE_API_URL=<backend dev>`, ไม่ตั้ง mock flags
4. เปิดทดสอบผ่าน `https://liff.line.me/{dev-liff-id}?target=attendance` — ส่งลิงก์ไว้ในกลุ่ม LINE ของทีม กดจากมือถือได้เลย ไม่ต้องยุ่ง Rich Menu ของ OA จริง (กติกา 18.1 ข้อ 4)

**Flow ประจำวัน:** เขียนบน localhost ทั้งวัน → พอใจแล้ว push `dev` → เปิดลิงก์ในกลุ่ม LINE เช็คบนมือถือ → ผ่านแล้วค่อย PR เข้า main

**(Optional) loop มือถือแบบทันที:** ถ้ารู้สึกรอ Vercel ช้า เพิ่ม LIFF ID ตัวที่ 4 ชี้โดเมนคงที่ของ **cloudflared named tunnel** แล้วรัน `npm run dev` ลอด tunnel — แก้โค้ดเห็นบนมือถือทันที (ngrok ฟรีใช้ไม่ได้เพราะสุ่มโดเมนใหม่ทุกครั้ง endpoint ตามไม่ทัน) — ทำเมื่อจำเป็น ไม่บังคับ

### 19.4 กับดักที่เจอกันเกือบทุกทีม

- **LINE Login channel สถานะ Developing → login ได้เฉพาะ admin/tester ของ channel** — เพิ่มทุกคนในทีม (และ UAT tester ในอนาคต) เป็น tester ใน LINE Developers Console ก่อน ไม่งั้นเจอ error 400 งง ๆ ทั้งที่โค้ดถูก
- อย่าลืมสลับ flag ให้ถูกโหมด: `VITE_LIFF_MOCK` / `VITE_API_MOCK` มีผลเฉพาะ local — ถ้า UI "ข้อมูลไม่อัปเดต" ให้เช็คก่อนว่า MSW ยังเปิดค้างอยู่หรือเปล่า

## 20. Error Handling ฝั่ง UI — 4 ชั้นจากนอกเข้าใน

### 20.1 ชั้น 1: Error Boundary (กัน crash จอขาว)

ใช้ `react-error-boundary` ครอบ 2 ระดับ:
- **ระดับแอป** (ใน providers ใต้ LiffGate) — ตาข่ายสุดท้าย: หน้า "เกิดข้อผิดพลาด" + ปุ่มโหลดใหม่
- **ระดับ route** — `errorElement` ของ React Router ต่อเพจ: พังแค่หน้าเดียว ไม่ล้มทั้งแอป

เหตุผล: บนมือถือหลากรุ่นใน in-app browser มีทางพังที่คาดไม่ถึงเสมอ — จอขาวเงียบ ๆ คือ UX ที่แย่ที่สุด

### 20.2 ชั้น 2: LiffGate error state (ทางเข้าแอปล้มเหลว)

LiffGate ต้องมี 3 สถานะ ไม่ใช่แค่ loading: `loading` → `ready` → **`error`** — `liff.init()` fail ให้แสดงหน้า "กรุณาเปิดผ่านแอป LINE / ลองใหม่" ไม่ใช่หมุนค้างตลอดกาล (เจอจริงเมื่อ user เปิดจาก browser นอก หรือ endpoint ตั้งผิด)

### 20.3 ชั้น 3: axios interceptor — normalize ทุกอย่างเป็น `ApiError`

```ts
// lib/api-client.ts
import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// แนบ JWT — auth feature เรียก setAuthToken() หลัง login
// (lib ห้าม import จาก features ตามกฎเหล็ก จึงใช้ setter แทน)
let authToken: string | null = null;
export const setAuthToken = (t: string | null) => { authToken = t; };

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data.data, // แกะ { data } อัตโนมัติ (16.1)
  (err: AxiosError<{ error?: { code: string; message: string } }>) => {
    // ไม่มี response เลย = network ล้ม (สัญญาณวูบ — ปกติมากบนมือถือ)
    if (!err.response) {
      throw new ApiError('NETWORK_ERROR',
        'เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต', 0);
    }
    const body = err.response.data?.error;
    const apiErr = new ApiError(
      body?.code ?? 'UNKNOWN',
      body?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      err.response.status,
    );
    // ดัก code กลางที่จุดเดียว (16.2)
    if (apiErr.code === 'ID_TOKEN_EXPIRED') { /* re-login flow 13.3 */ }
    if (apiErr.code === 'UNAUTHORIZED') { /* ล้าง session → auth ใหม่ 13.1 */ }
    throw apiErr; // code เฉพาะงานไหลต่อให้ feature จัดการ
  },
);
```

ผล: ไม่มี error ดิบของ axios หลุดถึง UI — ทุกจุดในแอปเจอแค่ `ApiError { code, message, status }` รูปเดียว

### 20.4 ชั้น 4: มาตรฐาน query vs mutation

| | useQuery (โหลดข้อมูล) | useMutation (กดปุ่มทำ action) |
|---|---|---|
| แสดง error | **แทนที่เนื้อหา** ด้วย `<ErrorState message retry={refetch}>` — ห้าม toast (toast หายแล้วผู้ใช้ค้างกับหน้าว่าง) | **toast** (sonner) ด้วย `message` จาก ApiError เป็น default |
| retry | `retry: 2` แต่ **ไม่ retry 4xx** (ยิงซ้ำได้คำตอบเดิม) | **`retry: 0` เสมอ** — auto-retry ตอน network กำกวมเสี่ยงยิงซ้ำ (ลงเวลา 2 รอบ!) ให้ผู้ใช้กดเอง + ปุ่ม disabled ระหว่าง `isPending` กันกดรัว |
| code เฉพาะงาน | — | feature ดักเอง: `QUOTA_EXCEEDED` → โชว์ที่ฟอร์มตรงช่องวันที่, `OUT_OF_GEOFENCE` → เสนอ remote clock (3.1), `REQUEST_NOT_PENDING` → toast + refresh รายการ |

```ts
// lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500)
          return false; // 4xx ไม่ retry
        return failureCount < 2;
      },
    },
    mutations: { retry: 0 },
  },
});
```

### 20.5 ของที่ต้องสร้าง + หมายเหตุ

- Shared components: `<ErrorState message onRetry>` และ `<EmptyState>` ใน `src/components/`
- `errorElement` ทุก route ใน `app/router.tsx`
- `NETWORK_ERROR` ถูกเพิ่มในตาราง 16.2 แล้ว (สร้างโดย client ไม่ใช่ backend)
- **Error logging (Sentry ฯลฯ): ติดธง optional ไว้ก่อน** — เป็นหน่วยงานที่อาจมีข้อจำกัดส่งข้อมูลออกนอก (โยงคำถาม 23.2) อย่าเพิ่งผูกจนกว่า infra จะเคาะ

## 21. Testing Strategy — ทีมเล็ก test ที่คุ้มก่อน ไม่ไล่ coverage

### 21.1 เครื่องมือ

**Vitest** (native กับ Vite ใช้ config เดียวกัน) + **@testing-library/react** + **@testing-library/user-event** + **MSW ชุดเดียวกับ dev** (handlers จาก 19.2 reuse ในเทสต์ได้ตรง ๆ — mock กับ test พูด contract เดียวกันเสมอ)

### 21.2 อะไรต้อง test แค่ไหน (ไล่ตามชั้นของหัวข้อ 7.2)

| ชั้น | ระดับ | เหตุผล |
|---|---|---|
| **`utils/` pure functions** | ✅ **ภาคบังคับ ทุกตัว** — โดยเฉพาะ `countLeaveDays` (รวมเคสวันหยุด 3.5, คร่อมเสาร์อาทิตย์, วันเดียว, ข้ามเดือน/ปี) และ logic ที่แตะเงิน/โควตา | test ง่ายสุด (input→output) แต่ผิดแล้วเจ็บสุด — เป็นเหตุผลที่แยกออกมาตั้งแต่หัวข้อ 7 |
| **Custom hooks ที่มี logic** | เลือกเฉพาะตัวที่มีเงื่อนไข เช่น `useGeolocation` (retry/error code 9), flow `useSubmitLeave` | test ผ่าน component หรือ `renderHook` + MSW |
| **Components critical** | เลือกเฉพาะ: `LeaveForm` (validation + `QUOTA_EXCEEDED` โชว์ถูกที่), `ClockButton` (สถานะ ใน/นอกรัศมี/remote/isPending disabled), `ApprovalActionSheet` (reject บังคับเหตุผล) | จุดที่พังแล้วกระทบเงิน/เวลา/การอนุมัติ |
| Pages / layout / component แสดงผลล้วน | ❌ ข้าม | ต้นทุนสูง ผลตอบแทนต่ำ เปลี่ยนบ่อยตาม design |
| **E2E automation** | ❌ **ยังไม่ทำ** | LIFF ใน in-app browser ของ LINE automate ไม่ได้จริง — แทนด้วย manual checklist (21.4) |

### 21.3 ตัวอย่างเทสต์ภาคบังคับ

```ts
// features/leave/utils/leave-days.test.ts
import { describe, it, expect } from 'vitest';
import { countLeaveDays } from './leave-days';

describe('countLeaveDays', () => {
  it('วันเดียว = 1', () =>
    expect(countLeaveDays('2026-07-08', '2026-07-08', [])).toBe(1));

  it('คร่อมเสาร์อาทิตย์ ไม่นับ', () =>
    // ศ. 10 → จ. 13 = 2 วันทำงาน
    expect(countLeaveDays('2026-07-10', '2026-07-13', [])).toBe(2));

  it('หักวันหยุดบริษัท (3.5)', () =>
    expect(
      countLeaveDays('2026-07-27', '2026-07-29', ['2026-07-28']) // วันเฉลิมฯ
    ).toBe(2));
});
```

### 21.4 Manual Device Checklist ก่อน release (แทน E2E)

รันบนเครื่องจริง **iOS + Android** ผ่าน LIFF UAT ทุกครั้งก่อนขึ้น PRD — รวมของที่จดไว้กระจายตามหัวข้อ:

- [ ] เปิดจาก Rich Menu ทุกปุ่ม → ลงถูกหน้า (liff.state / `?target=` — 12.1)
- [ ] Register flow: OTP ครบวง + เคส OTP ผิด/หมดอายุ (3.4)
- [ ] ลงเวลา: ในรัศมี, นอกรัศมี (ปุ่ม disable + เสนอ remote), remote + เหตุผล (3.1)
- [ ] GPS: ปฏิเสธ permission → ข้อความถูกต้อง, ที่อับสัญญาณ → retry ทำงาน (15)
- [ ] ยื่นลา + ไฟล์แนบ + ยกเลิกใบ PENDING (3.2)
- [ ] หัวหน้า: อนุมัติ/ปฏิเสธ + badge จำนวน + ประวัติ (17.5)
- [ ] Drawer: swipe ไม่ตีกับ gesture LINE, ปุ่มไม่โดน home bar บัง (10.2)
- [ ] สลิป: เปิดดู + ส่งอีเมล (3.3)
- [ ] ปิดแอปแล้วเปิดใหม่ → silent auth ไม่สะดุด (13.1)
- [ ] เน็ตวูบกลางทาง → NETWORK_ERROR + ลองใหม่ได้ ไม่ยิงซ้ำ (20.4)

### 21.5 CI

รัน `vitest run` + `tsc --noEmit` + ESLint ทุก PR (GitHub Actions หรือให้ Vercel build fail เมื่อเทสต์ไม่ผ่าน) — เทสต์ภาคบังคับ (utils) เร็วระดับวินาที ไม่ถ่วง pipeline

### 21.6 เรื่อง E2E — บันได 3 ขั้น (เคาะแล้ว: เริ่มขั้น 1)

เหตุที่ E2E แท้ทำไม่ได้: แอปรันใน in-app browser ของ LINE ซึ่ง Playwright/Cypress ควบคุมไม่ได้ (launch LINE, กด Rich Menu, inspect WebView ไม่ได้) และความเสี่ยงจริงอยู่ตรงนั้นหมด (liff.state, login redirect, GPS จริง, gesture, safe-area) — E2E บน desktop จับ bug พวกนี้ไม่ได้

| ขั้น | คืออะไร | สถานะ |
|---|---|---|
| **1** | vitest (utils + component critical) + **manual device checklist 21.4** | ✅ **ใช้ตอนนี้** — เพียงพอสำหรับเริ่ม |
| **2** | Playwright บน desktop + liff-mock + MSW — จำกัดแค่ **3-5 flow กระดูกสันหลัง** (ยื่นลา, ลงเวลา onsite/remote, อนุมัติ/ปฏิเสธ, ยกเลิกใบลา) รันใน CI — คุ้มครองการประกอบร่าง router+form+query ทั้งเส้น แต่**ไม่แทน** checklist 21.4 (พฤติกรรม LINE/มือถือยังต้องเครื่องจริง) | ⏭️ เพิ่มเมื่อ flow เริ่มนิ่ง — ห้ามเผลอเขียนไล่ทุกหน้า จะกลายเป็นภาระ maintain ที่ทีมเล็กแบกไม่ไหว |
| **3** | Automation บนอุปกรณ์จริง (device farm) | ❌ ไม่แนะนำ — ต้นทุนสูงมาก และยังจำลองการเปิดผ่าน LINE แท้ ๆ ไม่ได้อยู่ดี |

---

# ส่วน G — แผนงานและเรื่องค้าง

## 22. Recommendations (แผนลงมือทำ)

### ขั้นที่ 1 — Setup (สัปดาห์แรก)
1. `npm create vite@latest` เลือก `react-ts` แล้วติดตั้ง React 19 (หรือใช้ `create-liff-app` ของ LINE แล้วอัปเป็น React 19)
2. วางโครงสร้าง feature-based ตามข้อ 5 **ตั้งแต่วันแรก** พร้อม ESLint rule ตามข้อ 6
3. สร้าง LIFF app 1 ตัว, Endpoint URL = root, เขียน `LiffProvider` + `LiffGate`
4. ตั้ง Rich Menu deep link 3 ปุ่มชี้ `/attendance`, `/leave`, `/payroll`

### ขั้นที่ 2 — Core (สัปดาห์ 2-4)
5. ทำ `auth` ก่อนเสมอ: LIFF login → ส่ง ID token → backend verify → ออก JWT ระบบ
6. ตั้ง `lib/api-client.ts` + interceptor แนบ JWT, ตั้ง TanStack Query + Zustand
7. ทำทีละ feature ตามลำดับความเสี่ยง:
   - `attendance` (GPS + geofence + remote clock)
   - `leave` + `calendar` (ฟอร์ม RHF + Zod, ยกเลิกใบลา, ปฏิทิน/วันหยุด)
   - `approval` (ฝั่งหัวหน้า — ดูหัวข้อ 3)
   - `payroll` (read-only + ส่งอีเมล, เข้มเรื่องสิทธิ์ที่สุด)

### ขั้นที่ 3 — Hardening
8. Verify token ทุก endpoint, validate Zod ทั้งสองฝั่ง, audit log ครบ
9. Geofence + server timestamp ฝั่ง backend
10. Mobile-first: `viewport-fit=cover`, `env(safe-area-inset-*)`, ปุ่มใหญ่, ฟอนต์ไทย, loading state ระหว่าง `liff.init()`

### เกณฑ์ที่จะเปลี่ยนคำแนะนำในอนาคต
- **ย้ายไป FSD เต็มรูปแบบ** เมื่อทีมเกิน 5-8 คน หรือ feature เกิน ~10 domain
- **พิจารณา Next.js** เฉพาะเมื่อต้องมีหน้า public ที่ต้องการ SEO — LIFF ล้วน ๆ ไม่จำเป็น
- **เพิ่ม Selfie/Face verification** เมื่อองค์กรต้องการกันการฝากลงเวลา (buddy punching)

## 23. Open Questions — คำถามรอเคาะทั้งหมด (รวมที่เดียวกันลืม)

> หมายเหตุโครงเอกสาร: มีข้อเสนอให้แยกไฟล์นี้เป็นหลายไฟล์ — **ตัดสินใจคงไฟล์เดียว** เพราะระบบทั้งหมด (CLAUDE.md, agents, rules, feature plans) อ้างด้วยเลข §N ของไฟล์นี้ / จะกลับมาแยกเมื่อไฟล์แตะ ~2,500+ บรรทัด หรือหลายคนแก้ชนกันบ่อย

### 23.1 คำถามเชิงนโยบาย (จากเรื่อง Role/Approval และ Remote Clock)

| # | คำถาม | ตัวเลือก | สถานะ |
|---|---|---|---|
| 1 | **หัวหน้าลา ใครอนุมัติ?** | หัวหน้าของหัวหน้า (หลายชั้น) / ข้ามไปผู้บริหาร / อนุมัติตัวเอง (ไม่แนะนำ) | ⏳ รอเคาะ |
| 2 | **อนุมัติชั้นเดียวพอไหม?** | ชั้นเดียวจบ / บางประเภทต้องชั้นสอง — ถ้าชั้นเดียว ระบบง่ายลงมาก ออกแบบ status เผื่อไว้ให้แก้ทีหลังได้ | ⏳ รอเคาะ |
| 3 | **หัวหน้าเห็นอะไรของลูกทีมบ้าง?** | ✅ **เคาะแล้วจาก design:** เห็นเฉพาะ**ใบลาของลูกทีม** (ชื่อ+รูป, ประเภท, ช่วงวันที่, จำนวนวัน, เหตุผล, ไฟล์แนบ) — ไม่มีประวัติลงเวลา ไม่มีข้อมูลเงินเดือนของลูกทีม | ✅ ตอบแล้ว |
| 4 | **นโยบาย Remote Clock — ใครใช้ได้ ต้องมีหัวหน้ารับทราบไหม?** | (ก) อิสระ + เห็นใน report / (ข) แจ้งเตือนหัวหน้าทุกครั้ง / (ค) มีสถานะ "รอรับทราบ" / (ง) จำกัดสิทธิ์เฉพาะคนที่ถูกตั้งค่า — รายละเอียดดู ⚠️ ใน 3.1 | ⏳ รอเคาะ |
| 5 | **แก้ไขใบลา PENDING ได้จริงไหม?** — design มีจอ "Editable" + ปุ่มแก้ไขคำขอ (plan 03 §3.5) แต่ contract ไม่มี endpoint แก้ไข | (ก) มี `PUT /leave/requests/{id}` (กระทบ data model + ต้อง reset สถานะรีวิว) / (ข) ตัดฟีเจอร์ ใช้ "ยกเลิก+ยื่นใหม่" แล้วแจ้ง designer ปรับจอ | ⏳ **รอเคาะ — กระทบ UX+data model ควรเคาะเร็ว** |
| 6 | **หัวหน้า revoke ใบที่อนุมัติแล้ว** — design มีปุ่ม "ยกเลิกคำขอ" ในจอ History Details ฝั่งหัวหน้า (plan 04 §4.5) | ต้องเคาะ: endpoint (`POST /approval/requests/{id}/revoke`), status ใหม่ (`REVOKED` vs `CANCELLED`+actor), **คืนโควตา**, เงื่อนไขเวลา (ยกเลิกได้ถึงเมื่อไหร่ — ก่อนวันลาเริ่ม?), audit log | ⏳ **รอเคาะ — กระทบ status model+โควตา ควรเคาะเร็ว** |

### 23.2 คำถาม Infra — ต้องไปถามเพิ่มก่อนเคาะ UAT/PRD

| # | คำถาม | ทำไมสำคัญ |
|---|---|---|
| 1 | **ระบบ admin เดิมโฮสต์อยู่ที่ไหน?** (cloud เจ้าไหน / on-premise / ผู้ให้บริการไทย) | ถ้า backend LIFF ต้องต่อ DB ระบบเดิมตรง ๆ (17.4 แบบ ข) การวางไว้ infra เดียวกันง่ายกว่ามาก — ต่อ DB ข้าม cloud คือปัญหา network/security |
| 3 | **Map library สำหรับหน้าลงเวลา** — design เป็นแผนที่เต็มจอ (plan 02): Google Maps JS SDK vs Longdo Map (vendor ไทย) vs MapLibre + tile provider (ฟรี แต่ยังต้องมี key ของเจ้า tile) | **ตัวเลข Google (verify ก.ค. 2026):** Dynamic Maps ฟรี 10,000 loads/เดือน เกินคิด $7/1,000 — ที่ 2 เปิด/คน/วัน × 22 วัน: 100 คน = 4,400 ✅ ฟรี / ~227 คน = จุดพอดี / **300 คน = 13,200 → จ่าย ~$22 ≈ 700-800 บาท/เดือน** (ลดกลับเข้าฟรีได้ถ้าหน้า clock-out ไม่โชว์แผนที่เต็ม) — **ตัวเงินไม่ใช่ประเด็น ประเด็นคือต้องผูก billing account** → คำถามถึง SA: มี Google key/billing อยู่แล้วไหม? เปิดใหม่ติดระเบียบจัดซื้อไหม? หรือมีนโยบายใช้ Longdo? — dev ไม่ block: `MapView` เป็น interface กลางสลับ provider ได้ (plan 02) ต้องได้คำตอบก่อน UAT + กติกาคุม map loads ดู §15 |
| 2 | **มีข้อกำหนดเรื่องโฮสต์ไหม?** — โดเมนใน design เป็น `sp.go.th` (หน่วยงานรัฐ) ซึ่งมักมีข้อกำหนดโฮสต์ในประเทศ/ผ่านหน่วยงานกลาง/มาตรฐานความปลอดภัยภาครัฐ | กำหนดทางเลือก UAT/PRD ทั้งหมด — ถ้ามีข้อกำหนด อาจใช้ Vercel ได้เฉพาะ DEV และ UAT/PRD ต้องอยู่ infra ที่กำหนด |

> เมื่อได้คำตอบ 2 ข้อนี้ → กลับมาเติมช่อง Hosting/Domain ของ UAT, PRD ในตาราง 18.1 และเคาะ 17.4 (API กลาง vs ต่อ DB ตรง) ไปพร้อมกัน

## ภาคผนวก: สิ่งที่ควรเช็กก่อนเริ่มจริง
- เวอร์ชัน library เปลี่ยนเร็ว — เช็ก peer dependency กับ React 19 ทุกตัวก่อนติดตั้ง
- เช็ก LIFF release notes (พฤติกรรมบางอย่างเปลี่ยนตามเวอร์ชัน LINE app เช่น multi-tab view ตั้งแต่ LINE 15.12.0)
- Zod v3 กับ v4 syntax ต่างกันบางจุด (เช่น `z.string().email()` → `z.email()`)