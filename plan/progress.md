# Progress — HR LIFF App

## 1. สำหรับ session ใหม่: เริ่มตรงนี้ก่อน

### 1.1 สถานะปัจจุบัน
- **2026-07-21** — **P0 ✅ (เคาะ+commit แล้ว)** · **P1 ทำเสร็จ+redesign รอผู้ใช้เคาะ (🔍)**.
- **P1 — Design tokens + globals + utils**: worker → consultant (รอบแรกเจอ guard end<start + halfDay ขัดเอกสาร) → **ผู้ใช้เปลี่ยนโจทย์เป็น period รายวัน** (design 6.1/6.2) → worker แก้ code (2 pure functions + `src/types/leave.ts`) → main agent แก้เอกสารครบ + ลบรูปเก่า → consultant รอบสองผ่าน (logic+เทสต์ถูกตรงปฏิทินจริง). ดู entry "P1 — leave-days redesign" ในบันทึกแก้แผน.
- ผล verify (main agent รันเอง): `lint` clean · `tsc -b` exit 0 · `test` **26 passed** (รวม mixed [full,am,full]→2.5) · `build` ✓.
- **P0 commit แล้ว**; ไฟล์ P1 + doc edits ยัง untracked/modified — รอผู้ใช้เคาะ P1 ก่อน commit.
- การตัดสินใจสถาปัตยกรรม D1-D3 (plan.md §1) **ผู้ใช้ยืนยันแล้ว 2026-07-21 พร้อมเงื่อนไข**:
  - **D1** shared `useHolidays` ✅ — เงื่อนไข: day-count เป็น **pure function รับ `holidays[]` param** (อยู่ utils/date.ts); `useHolidays` = **แค่ห่อ `useQuery(['holidays', year])` staleTime ยาว** ไม่มี logic นับวัน *(หมายเหตุ: `countLeaveDays` ถูกแทนด้วย `listLeaveWorkingDays`+`sumLeaveDays` — ดู entry "P1 leave-days redesign")*
  - **D2** ยก card ไป `src/components/` ✅ — เงื่อนไข: การ์ดทั้งสอง **presentational ล้วน** รับ data+callbacks props เท่านั้น **ห้าม useQuery/useMutation/navigate ในการ์ด**; type `LeaveRequest` **ย้ายไป `src/types/`**
  - **D3** ฟอนต์ **Kanit อย่างเดียวทั้งระบบ** self-host ✅ — เปิด `@font-face` แล้ว (2026-07-21) ใช้ **`.woff2` 4 น้ำหนัก** (400/500/600/700, normal) ที่ `src/assets/fonts/`; build bundle เข้า dist (~53KB/ไฟล์). ลบไฟล์ไม่ใช้ 15 ตัวออกแล้ว (italic ทุกตัว + น้ำหนัก 100/200/300/800/900 + `Kanit.css` พ่วง). ✅ ไม่มีงานค้างฟอนต์แล้ว
- **Mock service + swagger** (plan.md §1.5): host `https://infeasible-subcandidly-judie.ngrok-free.dev/`, swagger `/docs/`. กติกา: ถ้า API ขาด/ติด **แจ้งผู้ใช้** ให้แก้ backend.
  - 🔴 **ต้องแจ้ง/รอผู้ใช้แก้:** Swagger `/docs/` ยังไม่ถูก config (ชี้ petstore default) + ไม่มี `openapi.json` → ยังไม่มี machine-readable contract
  - ⚠️ **รอเคาะ path:** `/auth/register`, `/auth/otp/request`, `/auth/otp/verify` = 404 (กระทบ P9-P10)
  - ✅ ยืนยันแล้ว: envelope `{error:{code,message}}` ไทย, ไม่มี `/api` prefix, `POST /auth/login` รับ `idToken`, protected routes (holidays/attendance/leave/payroll) = 401

### 1.2 งานถัดไป
- **P2 — lib ชั้น API** (plan.md §3 → P2). เริ่มเมื่อผู้ใช้เคาะ P1. ทำ `api-client.ts` (ApiError/interceptor + `setAuthToken` + `NETWORK_ERROR`), `query-client.ts` (query retry ไม่เอา 4xx, mutations retry:0), โครง MSW ต่อ feature. **ย้ำ:** MSW handlers ต้อง mirror path จริง (ไม่มี `/api` prefix) + envelope + Thai message ตามที่ probe เจอ (plan §1.5); axios แนบ `ngrok-skip-browser-warning: 1` เมื่อ base URL เป็น ngrok.

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
4. อ่าน "บันทึกแก้แผน" (ท้ายไฟล์นี้) ก่อนลงมือทุกครั้ง — เก็บกับดักของ prototype + สิ่งที่ consultant ดักไว้

## 2. งานแต่ละเฟส
สถานะ: ⬜ ยังไม่เริ่ม / 🔄 กำลังทำ / 🔍 รอรีวิว / ✅ เสร็จ+ผู้ใช้เคาะแล้ว

| เฟส | ชื่อ | สถานะ | หมายเหตุ |
|---|---|---|---|
| P0 | Project scaffold + tooling | ✅ | ผู้ใช้เคาะ+commit แล้ว 2026-07-21 (ดู deviation ในบันทึกแก้แผน) |
| P1 | Tokens + globals.css + utils กลาง | 🔍 | เสร็จ+redesign (period รายวัน) รอผู้ใช้เคาะ · สีเป็น placeholder รอ Figma |
| P2 | lib ชั้น API | ⬜ | |
| P3 | LIFF shell | ⬜ | |
| P4 | Shared: ปุ่ม + feedback | ⬜ | |
| P5 | Shared: list/display | ⬜ | |
| P6 | Shared: form controls + shadcn base | ⬜ | |
| P7 | Shared: Calendar + DateRangeField | ⬜ | ยากสุด §10.1 |
| P8 | Auth core | ⬜ | |
| P9 | Register form | ⬜ | ⚠️ ThaID/email domain = open Q |
| P10 | OTP + Complete | ⬜ | |
| P11 | Attendance foundation | ⬜ | ⚠️ map provider = open Q |
| P12 | ClockPage state machine | ⬜ | ⚠️ remote policy = open Q |
| P13 | Attendance history | ⬜ | |
| P14 | Leave list shell | ⬜ | |
| P15 | Leave detail + cancel | ⬜ | ⚠️ ห้ามทำแก้ไขใบลา (23.1#5) |
| P16 | Leave create form | ⬜ | ⚠️ teammates ไม่มี endpoint |
| P17 | Calendar: Holidays | ⬜ | |
| P18 | Calendar: LeaveCalendar | ⬜ | |
| P19 | Approval list | ⬜ | |
| P20 | Approval detail + ตัดสิน | ⬜ | ⚠️ ห้ามทำ revoke (23.1#6) |
| P21 | Payroll | ⬜ | |
| P22 | Hardening + release prep | ⬜ | DEV Vercel เท่านั้น |

## บันทึกแก้แผน
(append-only — วันที่ + สิ่งที่เปลี่ยนจาก plan.md + เหตุผล + กับดักที่เจอ)

- **2026-07-21 (kickoff)** — กับดักที่ consultant ดักไว้ ให้ทุก session ระวัง:
  1. **ไอคอนประเภทลาเป็น `.png`** (`src/assets/leave/leave-*.png`) ไม่ใช่ `.svg` — list โฟลเดอร์ก่อน import เสมอ (เดาผิดนามสกุล build พัง)
  2. `tsconfig.app.json` ยังไม่มี `strict:true` + ไม่มี alias `@/*`; ESLint ยังไม่มี `import/no-restricted-paths` — ต้องตั้งใน P0 และ **zones ต้องครบ 6 features** (ตัวอย่าง §6 มีแค่ 4 ขาด approval, calendar)
  3. ไม่มี `test` script — เพิ่มใน P0
  4. Design มี **40 PNG** (ไม่ใช่ 37) — variant เพิ่ม: Leave `6.1`/`6.2`, Payroll `2.1` fullscreen
  5. ค่าสี tokens = อ่านจากภาพ ยังไม่ดูดจาก Figma → **งานค้าง**: ดูดค่าสีจริงจาก Figma มาแทน placeholder
  6. Vite 8 / TS 6 / ESLint 10 ใหม่มาก — เช็ค peer dep ทุก lib ก่อนติดตั้ง (โดยเฉพาะ `@tailwindcss/vite`, vitest, shadcn+React19)
  7. Open Questions §23 ที่ **ห้าม implement เอง** — ดูตาราง plan.md §4 (ThaID, email domain, remote policy, แก้ไขใบลา, revoke, teammates endpoint, map provider, infra UAT/PRD)

- **2026-07-21 (P0)** — deviation + กับดักจาก review:
  1. **ESLint: ใช้ `eslint-plugin-import-x@4.17.x` แทน `eslint-plugin-import`** — ตัวจริงประกาศ peer dep แค่ ESLint ≤9 ชนกับ ESLint 10 ในโปรเจกต์ (ยืนยันจาก upstream). rule namespace เปลี่ยน `import/no-restricted-paths` → **`import-x/no-restricted-paths`**. ทุกที่ในเอกสาร/CI เฟสหลังที่อ้าง rule นี้ต้องใช้ชื่อใหม่. **✅ แก้ข้อความแล้ว (ผู้ใช้เคาะ 2026-07-21):** CLAUDE.md, plan.md, docs/architecture.md §6 (ตัวอย่าง config อัปเดตครบ 6 features + stores/config + note resolver)
  2. **กับดัก resolver (สำคัญ):** `no-restricted-paths` จะ **เงียบ (ไม่ error)** กับ import ที่ resolver resolve ไม่ได้. โปรเจกต์ใช้ alias `@/` เป็นหลัก → ต้องมี resolver ที่อ่าน tsconfig `paths` (`eslint-import-resolver-typescript`) ไม่งั้นกฎเหล็กเป็นเสือกระดาษ. **เพิ่มโฟลเดอร์ shared ใหม่ในอนาคตต้องเติมเข้า zone target ด้วย** (ล่าสุดเพิ่ม `src/stores`, `src/config`)
  3. **งานค้างเฟสหลัง:** `App.tsx` ยังอยู่ `src/` root → **P3 ย้ายเข้า `src/app/`**; ถอด `passWithNoTests:true` (vitest.config.ts) ตอน **P1** เมื่อมีเทสต์ utils แล้ว; `index.html` title ยังเป็นอังกฤษ (usePageTitle ทับตอน P3)

- **2026-07-21 (P1 — leave-days redesign, ผู้ใช้สั่ง)** — เปลี่ยนโมเดลวันลาเป็น **period รายวัน** (มี design ฟอร์มใหม่ 6.1 วันเดียว / 6.2 หลายวัน รวมได้ 2.5):
  1. **ยกเลิก `countLeaveDays` + param `halfDay` ทั้งหมด** → แทนด้วย 2 pure functions ใน `src/utils/date.ts`:
     - `listLeaveWorkingDays(start,end,holidays[]): string[]` — วันทำงานในช่วง (ตัดเสาร์อาทิตย์+วันหยุด); **end<start → [] ไม่ throw** (Zod ฟอร์ม validate เอง)
     - `sumLeaveDays(days: LeaveDayEntry[]): number` — full=1, am/pm=0.5 (เทสต์ 0.5 ตาม testing.md ชี้ที่ตัวนี้)
  2. **type กลาง `src/types/leave.ts`:** `LeaveDayPeriod` ('full'|'am'|'pm') + `LeaveDayEntry` ({date, period}) — contract primitive ใช้ร่วม ฟอร์ม+POST+GET (ตาม D2)
  3. **Contract เปลี่ยน:** `POST /leave/requests` body → `days:[{date,period}]` (ใบวันเดียวก็ days ยาว 1 — shape เดียว). Validation แบ่งชั้น: **Zod ฟอร์ม = ด่านเข้ม** (days ครบทุกวันทำงานต่อเนื่อง) / **backend = เช็คระดับรายการ** (แต่ละ entry เป็นวันทำงานจริง, ไม่ซ้ำ, period ถูก — ไม่บังคับต่อเนื่องครบช่วง)
  4. **[กับดัก P16]** ฟอร์มหลายวัน: render แถวต่อวันจาก listLeaveWorkingDays; **วันเสาร์อาทิตย์/วันหยุด = แถว disabled label "วันหยุด" ไม่มี toggle ไม่นับ**; ต้องแสดงครบทุกวันทำงาน**รวมวันเริ่ม** (Figma ตัวอย่างตกวันเริ่ม 18 ไป — ยืนยัน designer แล้ว, ยึดกติกาวันทำงาน §4.1 ไม่ยึดวันที่ใน mockup)
  5. **🔮 ฟีเจอร์อนาคต — ห้ามทำดักไว้ก่อน:** "ลบวันรายแถว" ในฟอร์มหลายวัน (รอนโยบาย+design ยืนยัน) — โครง `days[]` รองรับแล้ว วันนั้นแก้แค่ UI ฟอร์ม + ผ่อน Zod ไม่ต้องแตะ backend/contract
  5.1 **[กับดัก P16 เพิ่ม]** Zod ฟอร์มควรมี **เพดานความยาวช่วง** (เช่น ≤31 วัน) — `listLeaveWorkingDays` ไม่ cap ถ้าเลือกช่วงข้ามปีจะ render แถวเป็นพัน (UX/perf มือถือ)
  6. **✅ เอกสารอัปเดตแล้ว (main agent):** architecture §4.1 (code block ใหม่), §16.3 (POST body days[] + validation layering), §21.3 (test example), §7 mentions; feature-plans/03 §3.6 (form redesign + filename → 6.1/6.2) + คำถามค้างข้อ 3 (เคาะแล้ว); testing.md (เป้าเทสต์ 0.5 → sumLeaveDays); plan.md (P1/P6/P16/D1)
  7. **🗑️ ลบรูป** `docs/design/SME-PAYROLL/3.Leave/6.Create Request.png` (เดิม — ถูกแทนด้วย 6.1/6.2); ตอนนี้ design เหลือ 39 PNG
