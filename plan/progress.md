# Progress — HR LIFF App

## 1. สำหรับ session ใหม่: เริ่มตรงนี้ก่อน

### 1.1 สถานะปัจจุบัน
- **2026-07-21** — **P0 ✅** · **P1 ✅** · **P2 ✅** · **P3 ✅ (consultant 2 รอบ + ผู้ใช้เคาะ+commit)** · **P4 เริ่มแล้ว (🔄)**.
- **P9 ✅** · **P10 ทำเสร็จ+consultant loop ผ่าน รอผู้ใช้เคาะ (🔍) — จบ flow register (P8-P10)**.
- **P10 — OTP + Complete**: worker → consultant (core ผ่าน + F1 UX bug + F2 guard) → worker แก้ F1/F2/nicety → main verify (`lint` 0·`tsc` ✓·`test` **214**·`build` ✓) → consultant ตรวจ fixes: **ผ่าน**. contract flags (verify-otp invented) + notes จดในบันทึกแก้แผน P10.
- **P9 — Register form**: worker → consultant: **ผ่านแบบมี follow-up ไม่มี must-fix** (checksum ถูก, formatted→digits, Open Q §23 อ้อมถูก, security สะอาด). ไม่มี fix code บังคับ (follow-up = doc/contract/Figma/P22 จดแล้ว). `lint` 0·`tsc` ✓·`test` **186**·`build` ✓.
- **P8 — Auth core**: worker → consultant (security core ผ่าน + F1 must-fix) → worker แก้ F1/F2/F3 → main verify (`lint` 0·`tsc` ✓·`test` **154** ×2 ไม่ flaky·`build` ✓) → consultant ตรวจ fixes: **ผ่าน**. **⚠️ 3 contract flags ต้องแจ้ง backend/เคาะผู้ใช้** (ดูบันทึกแก้แผน P8).
- **P7 — Shared Calendar + DateRangeField**: worker (react-day-picker@10 + Calendar/DateRangeField/dateRange utils, 135 tests) → consultant: **ผ่านแบบมี follow-up ไม่มี must-fix** (v10 API ยืนยันตรง, วันที่ string ไม่ off-by-one, พ.ศ. ที่เดียว). ไม่มี fix code ต้องแก้ (follow-up = design fidelity Figma + P18 traps จดแล้ว). base calendar เสร็จ — P18 reuse.
- **P6 — Shared form controls + base**: worker (hand-vendor vaul/Radix + 8 form controls, 97 tests) → consultant (F1-F8; OTP design-vs-plan) → **ผู้ใช้เคาะ OTP=6 ช่อง** → worker แก้ (PeriodToggle compact, ลบ `as` OTP, OTP edge, citizenId doc) → main verify (`lint` 0·`tsc` ✓·`test` **99**·`build` ✓) → consultant ตรวจ fixes: ผ่าน (เงื่อนไข: จดสัญญา OTP completeness ให้ P10 — จดแล้ว). notes ในบันทึกแก้แผน P6.
- **P4 — Shared ปุ่ม+feedback**: worker → consultant (เจอ mobileOffset bug + button radius 2 ทรง + shadcn CLI ชน) → ผู้ใช้เคาะ (shape prop + hand-vendor) → worker แก้ → main verify (`lint` 0 · `tsc` ✓ · `test` **60** · `build` ✓) → **consultant รีวิวรอบสอง fixes: ผ่าน**. เอกสารอัปเดต (plan P4/P6/P7 hand-vendor, CLAUDE.md, progress). *(§1.4 อัปเดต: ทุกครั้งที่แก้ code จาก follow-up ต้องส่ง consultant ตรวจเสมอ เป็น loop จนผ่าน)*
- **P2 — lib ชั้น API**: worker → consultant (เจอ `as` cast + token codes + BASE_URL) → worker แก้ → main verify → **consultant รีวิวรอบสอง: ผ่าน**. `lint` 0 · `tsc` ✓ · `test` **35** · `build` ✓. P8 traps จดในบันทึกแก้แผน.
- **P1 — Design tokens + globals + utils**: worker → consultant → ผู้ใช้เปลี่ยนโจทย์เป็น period รายวัน → worker แก้ + main แก้เอกสาร → consultant ผ่าน → ผู้ใช้วางฟอนต์ Kanit woff2 (main เปิด @font-face + ลบ 15 ไฟล์ไม่ใช้) → **เคาะปิด**. ดู entry "P1 leave-days redesign" + D3 ในบันทึกแก้แผน.
- ผล verify P1: `lint` clean · `tsc -b` exit 0 · `test` **26 passed** · `build` ✓ (Kanit woff2 4 น้ำหนัก bundle เข้า dist).
- **ยังไม่ commit P1** (ผู้ใช้จัดการ commit เอง เหมือน P0) — ไฟล์ P1 + doc edits + fonts ยัง untracked/modified บน `main`.
- การตัดสินใจสถาปัตยกรรม D1-D3 (plan.md §1) **ผู้ใช้ยืนยันแล้ว 2026-07-21 พร้อมเงื่อนไข**:
  - **D1** shared `useHolidays` ✅ — เงื่อนไข: day-count เป็น **pure function รับ `holidays[]` param** (อยู่ utils/date.ts); `useHolidays` = **แค่ห่อ `useQuery(['holidays', year])` staleTime ยาว** ไม่มี logic นับวัน *(หมายเหตุ: `countLeaveDays` ถูกแทนด้วย `listLeaveWorkingDays`+`sumLeaveDays` — ดู entry "P1 leave-days redesign")*
  - **D2** ยก card ไป `src/components/` ✅ — เงื่อนไข: การ์ดทั้งสอง **presentational ล้วน** รับ data+callbacks props เท่านั้น **ห้าม useQuery/useMutation/navigate ในการ์ด**; type `LeaveRequest` **ย้ายไป `src/types/`**
  - **D3** ฟอนต์ **Kanit อย่างเดียวทั้งระบบ** self-host ✅ — เปิด `@font-face` แล้ว (2026-07-21) ใช้ **`.woff2` 4 น้ำหนัก** (400/500/600/700, normal) ที่ `src/assets/fonts/`; build bundle เข้า dist (~53KB/ไฟล์). ลบไฟล์ไม่ใช้ 15 ตัวออกแล้ว (italic ทุกตัว + น้ำหนัก 100/200/300/800/900 + `Kanit.css` พ่วง). ✅ ไม่มีงานค้างฟอนต์แล้ว
- **Mock service + swagger** (plan.md §1.5): host `https://infeasible-subcandidly-judie.ngrok-free.dev/`, swagger `/docs/`. กติกา: ถ้า API ขาด/ติด **แจ้งผู้ใช้** ให้แก้ backend.
  - 🔴 **ต้องแจ้ง/รอผู้ใช้แก้:** Swagger `/docs/` ยังไม่ถูก config (ชี้ petstore default) + ไม่มี `openapi.json` → ยังไม่มี machine-readable contract
  - ⚠️ **รอเคาะ path:** `/auth/register`, `/auth/otp/request`, `/auth/otp/verify` = 404 (กระทบ P9-P10)
  - ✅ ยืนยันแล้ว: envelope `{error:{code,message}}` ไทย, ไม่มี `/api` prefix, `POST /auth/login` รับ `idToken`, protected routes (holidays/attendance/leave/payroll) = 401

### 1.2 งานถัดไป
- **P11 — Attendance foundation** (plan.md §3 → P11). เริ่มเมื่อผู้ใช้เคาะ P10. `useGeolocation`/`getPositionWithRetry` (§15, retry+3 error), `haversine` (preview), `MapView` (MapLibre/tile ฟรีก่อน — map provider = open Q §23.2#3), MSW `GET /attendance/today`. ⚠️ ห้ามผูก Google key.

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
3. follow-up ต้องแก้ก่อนไปเฟสถัดไป เป็น **loop บังคับ**: `worker แก้ → main agent verify → consultant ตรวจ fixes` — **ทุกครั้งที่มีการแก้ code ต้องส่ง consultant ตรวจเสมอ** (ไม่ว่าจะรอบที่เท่าไร แม้ fix เล็ก/mechanical). ถ้า consultant เจอ fix ใหม่ → วน loop ซ้ำ. ปิดเฟสได้ก็ต่อเมื่อ consultant ผ่าน fixes รอบล่าสุดโดยไม่มี fix ที่ต้องแก้เหลือ → แล้วค่อยสรุป → รอผู้ใช้เคาะ
4. อ่าน "บันทึกแก้แผน" (ท้ายไฟล์นี้) ก่อนลงมือทุกครั้ง — เก็บกับดักของ prototype + สิ่งที่ consultant ดักไว้

## 2. งานแต่ละเฟส
สถานะ: ⬜ ยังไม่เริ่ม / 🔄 กำลังทำ / 🔍 รอรีวิว / ✅ เสร็จ+ผู้ใช้เคาะแล้ว

| เฟส | ชื่อ | สถานะ | หมายเหตุ |
|---|---|---|---|
| P0 | Project scaffold + tooling | ✅ | ผู้ใช้เคาะ+commit แล้ว 2026-07-21 (ดู deviation ในบันทึกแก้แผน) |
| P1 | Tokens + globals.css + utils กลาง | ✅ | เคาะแล้ว 2026-07-21 · สียัง placeholder รอ Figma (ใช้ตามนี้ก่อน) |
| P2 | lib ชั้น API | ✅ | consultant 2 รอบ + เคาะแล้ว 2026-07-21 |
| P3 | LIFF shell | ✅ | consultant 2 รอบ + เคาะ+commit แล้ว 2026-07-21 |
| P4 | Shared: ปุ่ม + feedback | ✅ | consultant loop ผ่าน + เคาะ+commit 2026-07-21 |
| P5 | Shared: list/display | ✅ | consultant loop ผ่าน + เคาะ+commit 2026-07-21 |
| P6 | Shared: form controls + base | ✅ | consultant loop ผ่าน + เคาะ+commit 2026-07-21 |
| P7 | Shared: Calendar + DateRangeField | ✅ | consultant ผ่าน + เคาะ+commit 2026-07-21 |
| P8 | Auth core | ✅ | consultant loop ผ่าน + เคาะ+commit 2026-07-21 · ⚠️ 3 contract flags (noted) |
| P9 | Register form | ✅ | consultant ผ่าน + เคาะ+commit 2026-07-21 · ⚠️ ThaID/email domain = open Q |
| P10 | OTP + Complete | 🔍 | เสร็จ+consultant loop ผ่าน (214 tests) รอผู้ใช้เคาะ |
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

- **2026-07-21 (P2 — lib ชั้น API)** — api-client + query-client + MSW skeleton. review เจอ + แก้แล้ว: (ก) เปลี่ยน `as unknown as ApiClient` → typed wrapper `api.get<T,T>` (0 cast), (ข) route `MISSING_TOKEN`/`INVALID_TOKEN` → onUnauthorized, (ค) `src/mocks/base.ts` BASE_URL `?? ''` fallback, (ง) main.tsx `.catch` + ngrok host เข้ม. eslint ignore `public/` (generated msw). **Pattern + กับดักที่เฟสหลังต้องรู้:**
  1. **เรียก API จาก feature:** `features/*/api/` ใช้ `api.get<Payload>('/path')` ได้ payload ตรง ๆ (envelope แกะแล้ว) — **ห้ามแตะ `res.data` / ห้ามสร้าง axios instance ใหม่ / ห้าม `as`**. mutation ทุกตัว retry:0 (query-client default), errors เป็น `ApiError{code,message,status}` (message ไทยแสดงตรง)
  2. **P8 auth ต้อง:** register `setOnIdTokenExpired`/`setOnUnauthorized` (callback ที่ lib เตรียมไว้ — ทำ liff.logout/login + ล้าง session ที่ฝั่ง feature); เพิ่มหน้า **`EMPLOYEE_INACTIVE`** (แจ้งติดต่อ HR §16.2 — ยังไม่ทำ); reuse `src/mocks/handlers/auth.ts` ในเทสต์
  3. **[🔴 กับดัก P8 — ต้องเคาะกับผู้ใช้ + probe]** `NEED_REGISTER` มากับ **HTTP 200** (§16.2) แต่ §14 pseudocode ตอบ `{code:'NEED_REGISTER'}` **ไม่มี envelope** → success interceptor (คืน `res.data.data`) จะกลืนเป็น `undefined` เงียบ. ต้อง probe mock service จริง + เคาะ shape ก่อนเขียน login (ทางที่เข้ากับ interceptor = `{data:{status:'NEED_REGISTER'}}`) — ห้ามดัด frontend เลี่ยง (plan §1.5)
  4. **login success shape** ใน MSW auth handler (`{token, employee{id,name,role}}`) เดาเอง — probe ยืนยันแค่ endpoint มี ยังไม่ยืนยัน shape สำเร็จ → เทียบ swagger จริงเมื่อผู้ใช้ config `/docs/` (blocker §1.5 ยังค้าง)
  5. **(review รอบสอง — ผ่าน, follow-up ต่ำ)** (ก) เพิ่มเทสต์ callback routing (onUnauthorized/onIdTokenExpired) ตอน P8; (ข) **[watch P21]** success interceptor คืน `res.data.data` — ถ้า backend ตอบ **204/body ว่าง** (เช่น POST ส่งสลิปเข้าอีเมล) จะได้ undefined/TypeError ดิบ ไม่ใช่ ApiError (contract §16.1 บอกทุก response มี envelope — ระวังตอนต่อ endpoint จริง); (ค) ngrok header เช็คแค่ `.ngrok-free.dev` — ถ้า tunnel ใหม่ได้ `.ngrok-free.app` header จะหยุดส่ง (เติม suffix ถ้าเจอ)

- **2026-07-21 (P3 — LIFF shell)** — LiffProvider/LiffGate(3 สถานะ)/router(13 routes+errorElement)/HomePage(?target= whitelist)/usePageTitle/ErrorBoundary. review เจอ + แก้: ยุบ branch mock/real (`$mock.set isLoggedIn:true` → code path เดียว), init guard กัน StrictMode, ลบ `as` cast ใน HomePage, เพิ่ม catch-all `*` route, `index.html` title → "SmartPay Connect". main แก้เอกสาร §20.1 (อนุญาต class ErrorBoundary) + §12.3 (catch-all route). **กับดัก/ข้อเท็จจริงที่เฟสหลังต้องรู้:**
  1. **P8:** โหมด mock ตอนนี้ set `isLoggedIn:true` แล้ว → gate ด้วย `liff.isLoggedIn()` ได้ทั้ง mock/real (ยุบ branch แล้ว ไม่มีกับดักเดิม)
  2. **P8:** liff-mock คืน `getIDToken()='id_token'` (default) โดยไม่สน login state → MSW `auth.ts` handler ต้องยอมรับค่านี้
  3. **placeholder:** `VITE_LIFF_ID=2000000000-devMock` ใน `.env.development` (mock only — LIFF ID จริงต่อ env รอผู้ใช้; ต่อ DEV/UAT/PRD แต่ละ env มี id แยก §18)
  4. **โหมดจริง (ไม่ mock) ยังไม่เคยรันจริง** — branch `!isMock`/`liff.login()` redirect พิสูจน์ได้ครั้งแรกเมื่อมี LIFF DEV + Vercel (§19.3); ก่อนหน้านั้นเทสต์ในเครื่องไม่ครอบ path นี้
  5. title placeholder ต่อ route (เช่น "รายละเอียดใบลา") ยังไม่ยืนยัน 1:1 กับ design ทุกจอ — finalize ตอนเพจจริง P8+
  6. **[เทสต์ P8]** `LiffProvider` ใช้ module-level memoized promise (`liffInitPromise`) → เทสต์ **init-reject → error state ต้องอยู่คนละไฟล์** กับเทสต์ ready (Vitest isolate module state ต่อไฟล์) หรือ export reset helper — กันคนเขียนเทสต์งงว่าทำไม memoize กินข้ามเคส

- **2026-07-21 (P4 — Shared: ปุ่ม + feedback)** — PrimaryButton/DangerSoftButton/GhostButton + BottomActionBar + Toast(sonner) + SuccessScreen + ErrorState/EmptyState. 54 tests, token-only, safe-area ครบ. review เจอ:
  1. **[must-fix — bug มือถือ] ✅ แก้แล้ว** sonner `offset` ถูกเมินที่ viewport ≤600px → เพิ่ม **`mobileOffset`** (safe-area) แล้ว. ยัง: เพิ่มเช็คตำแหน่ง toast ใน manual checklist §21.4 ตอน release
  2. **[deviation]** S7 ติดตั้ง `npm install sonner` ตรง ๆ แทน `npx shadcn add sonner` (plan.md P4) — shadcn CLI Nova preset ทับ `@theme`/Kanit (D3); Toaster custom เอง (`toast.custom()` เลี่ยง full-width banner บังคับของ sonner ≤600px)
  3. **[✅ ผู้ใช้เคาะ 2026-07-21 — button radius]** design มี **2 ทรง**: pill เต็ม (Registration/Success/ช่องกรอก) vs rounded-card ~16px (คู่ปุ่ม BottomActionBar). **เพิ่ม prop `shape:'card'|'pill'` แล้ว** (default 'card'; pill=`rounded-full`). P9/P10 ใช้ `shape="pill"`. duality นี้ลามถึง S16 form controls (P6 — ช่องกรอกจอ Registration = pill, Textarea ความเห็น = rounded-rect)
  4. **[✅ ผู้ใช้เคาะ 2026-07-21 — shadcn strategy] hand-vendor** (ไม่ใช้ CLI): P6/P7 copy source (drawer=vaul, dialog/select=Radix, calendar=react-day-picker) มา restyle ด้วย token เราตรง ๆ — globals.css ปลอดภัย 100% (พิสูจน์กับ sonner แล้ว). **ห้ามรัน `shadcn init/add`** (ทับ @theme/Kanit)
  5. **[Figma pass]** toast bg ยืม `--color-primary-dark` (ควรมี token `--color-toast-bg` แยก — จริงในรูปเข้มกว่า)
  6. **[กับดักเพจ P14+/P20/P21]** หน้าที่ใช้ `BottomActionBar` (fixed) ต้องเผื่อ padding-bottom ของ content เอง (~pb-28+safe-area) ไม่งั้นรายการท้ายจอโดนบัง

- **2026-07-21 (P5 — Shared: list/display)** — 10 components (SegmentedTabs/FilterChips/DropdownFilter/StatusBadge/LeaveTypeIcon/ListCard/DetailField/TypeBanner/AttachmentItem/ProfileBar) + `LeaveType`/`LeaveRequestStatus` ใน `src/types/leave.ts`. 70 tests, token-only, props-only. review เจอ+แก้ (loop ผ่าน): F1 SegmentedTabs prop `shape:'card'|'pill'` (default pill; Calendar=card), F2 DropdownFilter font 16px (กัน iOS zoom), F3 AttachmentItem hit area 44px, F6 เทสต์ FilterChips+LeaveTypeIcon src. **กับดัก/หนี้ที่เฟสหลังต้องรู้:**
  1. **[ข้อเคาะ P6]** `DropdownFilter` = native `<select>` restyle (deviation — plan ไม่ได้เขียน native ตรง ๆ). P6 เคาะ: คง native ถาวร vs สลับ Radix — ตัดจาก Figma ว่ามี open-state design ไหม (ชุด PNG ปัจจุบันไม่มี). Radix select ใช้เฉพาะ `SelectField` ในฟอร์ม
  2. **[กับดักมือถือ P6]** iOS WebKit zoom-on-focus ถ้า input/select/textarea font <16px → **form controls ทั้งชุด P6 ต้อง ≥16px** + เพิ่มเข้า manual checklist §21.4
  3. **[กับดัก P14/P16]** LABEL ประเภทลาใน `LeaveTypeIcon` = **alt fallback เท่านั้น** — ชื่อประเภทจริงมาจาก `GET /leave/types` (อย่าใช้ map นี้แสดงชื่อในการ์ด/ฟอร์ม กัน 2 แหล่ง diverge)
  4. **[กับดัก P17]** SegmentedTabs ฝั่ง Calendar ต้องส่ง `shape="card"` (Leave/Approval ใช้ default pill)
  5. **[กับดัก P18]** จุดปฏิทินประเภทลา = ใช้ `bg-leave-*` **token** ไม่ใช่รูป PNG ของ LeaveTypeIcon (architecture §10.3); LeaveTypeIcon PNG พื้นตันไม่โปร่งใส (asset เดิม — ใช้ `rounded-card+object-cover` ครอบ)
  6. **[Figma pass — ต่อ list เดิม]** badge SegmentedTabs (เหลืองในรูป vs `--color-warning` ส้ม), FilterChips unselected (ขาวจาง), AttachmentItem พื้นแถว (เทาอ่อน vs `bg-surface`), ListCard chevron alignment, pill borders (แทบไม่เห็นขอบในรูป)

- **2026-07-21 (P6 — Shared form controls + base)** — hand-vendor `vaul`(Drawer)/`@radix-ui/react-dialog`(Dialog)/`@radix-ui/react-select`(Select) restyle ด้วย token เรา (ไม่แตะ globals.css, ไม่ใช้ shadcn CLI) + TextInput(mask citizenId, shape pill)/Textarea/SelectField/OTPInput(6 ช่อง)/PeriodToggle(default+compact) + `utils/citizenId.ts`. font ≥16px ทุก input (กัน iOS zoom). setup.ts เพิ่ม polyfill pointer-capture (jsdom+vaul). 97 tests. review เจอ+แก้ (loop): PeriodToggle compact → mini-segmented ตาม design 6.2 (worker อ่านรูปผิดเป็นพื้นเขียว), ลบ `as` ใน OTPInput, OTP ลบช่องกลาง clear เฉพาะช่อง, doc comment citizenId. **การตัดสินใจ/กับดัก:**
  1. **[✅ ผู้ใช้เคาะ — deviation]** `OTPInput` = **6 ช่องแยก** (auto-advance) แม้ PNG `2.OTP.png` วาดกล่องเดียว — เอกสารอัปเดตแล้ว (feature-plans/01 §1.3 + plan.md P10)
  2. **[สัญญา P9]** TextInput mask citizenId ส่งค่า **formatted (มีขีด)** เข้า RHF → Zod ฟอร์มต้อง `extractCitizenIdDigits` ก่อน validate 13 หลัก+checksum; **payload API ส่ง digits ล้วน** (ไม่มีขีด)
  2.1 **[สัญญา P10 — OTP completeness]** `OTPInput` ใช้ space `' '` เป็น placeholder ช่องว่างภายใน → **ค่ายาว 6 อาจมี space กลางได้** (กรอกครบแล้วย้อนลบตัวกลาง). **P10 ห้ามเช็คครบด้วย `length===6`** — ต้องใช้ Zod `z.string().regex(/^[A-Z0-9]{6}$/)` เป็นเงื่อนไข enable ปุ่ม + validate ก่อนส่ง verify-otp (กัน space หลุดเข้า payload)
  3. **[กับดัก]** `Drawer dismissible={false}` — vaul อาจบล็อกปุ่มปิด (Drawer.Close) ด้วย ขัด §10.2 "ปุ่มปิดชัดเจนเสมอ" → ห้ามใช้ `dismissible={false}` จนกว่าจะมีเทสต์ยืนยันปุ่มปิดยังทำงาน
  4. **[RHF pattern]** TextInput/Textarea = forwardRef ใช้ `register()` ตรง; SelectField/OTPInput = ต้องผ่าน `<Controller>` (มี doc comment ในไฟล์)
  5. **[Figma pass]** PeriodToggle track ในรูปเทาอ่อน vs `bg-surface` ฟ้าอ่อน
  6. **[P22]** vaul+Radix เพิ่ม bundle >500KB warning — พิจารณา route-level code splitting
  7. **[manual checklist §21.4]** เพิ่ม "focus input ใน LINE iOS ต้องไม่ zoom" (implement ครบแล้ว รอ verify เครื่องจริง)

- **2026-07-21 (P7 — Shared Calendar + DateRangeField)** — hand-vendor **react-day-picker@10.0.1** (restyle token, ไม่ import style.css) + `Calendar`(custom MonthCaption พ.ศ. + CalendarDayButton ห่อ DayButton เดิม, merge components/classNames ให้ caller override) + `DateRangeField`(2 ช่อง+Drawer, mode range, ปุ่ม +/−) + `utils/dateRange.ts`(pure) + `formatThaiMonthCaption` ใน utils/date.ts (additive). 135 tests. วันที่ string ไม่ off-by-one, พ.ศ. ที่เดียว. consultant ยืนยัน v10 API ตรง §10.3. **กับดัก/หนี้เฟสหลัง:**
  1. **[🔴 กับดัก P18]** ห้ามส่ง `components={{ DayButton: (props)=>... inline arrow }}` (ตัวอย่าง §10.3 เขียนแบบนี้!) — identity ไม่นิ่ง → React remount ทั้ง grid ทุก render (focus หลุด + perf). ต้อง memo/component นอก render + leaveMap ผ่าน context/closure นิ่ง
  2. **[กับดัก P18]** เลขวันเสาร์-อาทิตย์สีเทา (ตาม `6.Calendar/1`) base ยังไม่ทำ — P18 ทำผ่าน modifiers/custom DayButton; `showOutsideDays` ส่งผ่าน rest ได้
  3. **[P18 override contract]** `components.DayButton`/`classNames` ที่ caller ส่ง มา ชนะ default (spread ทีหลัง) — P18 ใส่จุดสีประเภทลาได้โดยไม่ reimplement (มีเทสต์ยืนยัน)
  4. **[Figma pass]** range-selection style (วง `bg-primary` หัวท้าย + แถบ `bg-primary/10` กลาง) = invent (ไม่มี PNG ปฏิทินเปิด range); ปุ่ม −/+ ควรอยู่ในการ์ดเดียวกับช่อง "ถึงวันที่"; nav button 36px→40px + ลูกศร ← ; a11y label ปุ่มวันยังเป็น ค.ศ. (rdp default) ควรทำ พ.ศ. ผ่าน `labels.labelDayButton`
  5. **[rdp v10]** ชื่อ package แนะนำใหม่ = `@daypicker/react` (ชื่อเดิม `react-day-picker` ยัง publish v10) — เฝ้าดู v11; rdp พก date-fns ^4.1 เป็น dep ของตัวเอง dedupe กับ ^4.4 ของเรา
  6. **[follow-up โค้ดเล็ก — เก็บทีหลัง]** `as Date`/`as DateRange` ใน `Calendar.test.tsx` (test-only, avoidable ด้วย typed `vi.fn`) — consultant ประเมินไม่คุ้ม loop เดี่ยว; เก็บรวมตอนแตะไฟล์นั้นครั้งหน้า/P22

- **2026-07-21 (P8 — Auth core silent login)** — `features/auth/` (store Zustand ไม่ persist, api/login Zod boundary, useAuthBootstrap useMutation retry:0, AuthGate layout 4 สถานะ, ProtectedRoute +requireRole เผื่อ P19, registerAuthCallbacks module side-effect) + router ห่อ AuthGate + MSW `setAuthScenario`. 150 tests. **security core ผ่าน** (consultant ยืนยัน): exchange idToken→JWT ครั้งเดียวไม่ forward, role จาก login response (ไม่แตะ getProfile), ไม่ log token, token ไม่ persist. review เจอ **1 must-fix (worker แก้อยู่):** F1 = 401 กลางคัน → spinner ค้าง (reset startedRef re-login) + F2 error flash ID_TOKEN_EXPIRED + F3 pin tests.
  - **🔴 CONTRACT FLAGS (ต้องแจ้ง backend + เคาะผู้ใช้ — mock ยังทดสอบจริงไม่ได้):**
    1. **NEED_REGISTER shape:** frontend ต้องการ `{data:{status:'NEED_REGISTER'}}` (envelope §16.1) — แต่ §13.4 pseudocode เขียน bare `{code:'NEED_REGISTER'}` (ไม่มี envelope → interceptor กลืนเป็น undefined). backend จริงต้องตอบแบบ wrapped; ควรอัปเดต architecture §13.4/§16.3 (รอผู้ใช้เคาะ)
    2. **employee.role:** frontend บังคับ `role` ใน login response (§17.2) แต่ §13.4 pseudocode `employee:{id,name}` ไม่มี role → backend จริงต้องมี role (mock probe มีแล้ว); ควรอัปเดต pseudocode
    3. **mock service ตอบ authenticated เสมอ** (idToken อะไรก็ได้ → employee เดียว, ไม่เคย NEED_REGISTER) + `/auth/register`,`/auth/otp/*` = 404 + swagger ยัง petstore → **P9/P10 register/OTP ทดสอบ flow กับ service จริงไม่ได้ ต้องพึ่ง MSW ล้วน** จนกว่า backend/swagger พร้อม
  - **กับดัก P10:** หลัง verify-otp ต้อง `setSession()`; `useAuthBootstrap` เช็ค `isAuthenticated` ก่อน `need_register` (ห้ามสลับลำดับ ไม่งั้นวนเด้ง /register)
  - **กับดัก P9:** คน auth แล้วเปิด `/register` ตรง ๆ เห็นฟอร์มได้ → P9 ตัดสิน redirect '/' ถ้า authenticated
  - **P19:** `requireRole="manager"` พร้อมใช้ที่ ProtectedRoute (ยังไม่มี route ใช้)
  - **[fixes ผ่าน consultant รอบสอง]** F1/F2/F3 แก้แล้ว 154 tests (ไม่ flaky). minor เหลือ (ไม่ block): (ก) §21.4 checklist เพิ่มเคส "JWT/idToken หมดอายุกลางคัน → redirect กลับมาปกติ" บนเครื่องจริง; (ข) `useAuthBootstrap.test.tsx` listener ไม่ removeListener (cosmetic, เก็บทีหลัง)

- **2026-07-21 (P9 — Register form จอ 1.1/1.2)** — `features/auth/` RegisterPage(guard authenticated→'/', mode form|thaid|both) + RegisterForm(RHF+Zod v4: citizenId mask→extractDigits→13หลัก+**checksum mod11**, email z.email()+optional domain) + ThaidButton(pill/card, กด→toast **ไม่ต่อ OAuth** §23) + requestOtp(MSW) + registerStore(pendingOtp ส่งต่อ P10). 186 tests. consultant: **ผ่าน ไม่มี must-fix** (checksum algorithm ถูก, formatted→digits ครบวงจร, Open Q §23 เดินอ้อมถูก, security สะอาด). **notes/decisions:**
  1. **[เคาะแล้ว — root error ไปก่อน]** error 2 ชั้น: (ก) **client/Zod = ใต้ช่อง** (field ผิด เช่นเลขบัตร/อีเมล — ทำได้อยู่แล้ว), (ข) **server error (VALIDATION_ERROR/EMPLOYEE_NOT_FOUND/OTP_RATE_LIMITED) = root error ใต้ฟอร์ม** เพราะ backend ตอบแค่ code+message ไม่บอก field. ผู้ใช้เคาะ 2026-07-21: **ใช้ root error ไปก่อน**; ตำแหน่งแสดง/ทำเป็น dialog **รอ design ค่อยว่ากัน**. **[CONTRACT flag]** ถ้าอยากได้ server error ใต้ช่องเจาะจง → backend ต้องเพิ่ม `field` ใน error response (เช่น `{code,field:'citizenId',message}`) — ตอนนี้ยังไม่มี. (feature-plans/01 บรรทัด 14 ยังเขียน "ใต้ช่อง" — คงไว้ตามที่ผู้ใช้แก้ doc เอง)
  2. **[CONTRACT flags ต่อจาก P8 — invented ทั้งหมด รอ swagger]** `POST /auth/register/request-otp` (probe จริง 404), response `{refCode, email}`, error codes (`VALIDATION_ERROR/EMPLOYEE_NOT_FOUND/OTP_RATE_LIMITED`) + Thai messages = ออกแบบฝั่งเราทั้งหมด; **P10 verify-otp ซ้อนหนี้ก้อนเดียวกัน**
  3. **[กับดัก config]** `VITE_REGISTER_MODE=thaid` = จอตัน (ฟอร์มหาย + ThaID แค่ toast) → **ห้ามตั้ง `thaid` ใน env จริงจนกว่า ThaID OAuth เคาะ+ทำ** (dev preview เท่านั้น); email domain ยังไม่ตั้ง — ตอนเคาะโดเมนจริงต้องตัดสิน subdomain (`endsWith('@'+domain)` ตอนนี้ตัด subdomain) + strip `@` นำหน้า
  4. **[follow-up เล็ก P22/ครั้งหน้า]** F3 ZodError → fallback ข้อความไทยกลาง (ตอนนี้ dump อังกฤษถ้า backend shape เพี้ยน); F4 เทสต์ retry ใช้ default จริง; F7 Figma pass (gradient กลับทิศ from-primary/10→white vs design เข้มลงล่าง, label ชิดซ้าย vs design กึ่งกลาง, ThaID pill justify-center)
  5. **[กับดัก P10 พร้อมใช้]** guard `pendingOtp===null`→เด้ง /register (จดใน registerStore แล้ว); OTP ครบ=regex ไม่ใช่ length (P6 ข้อ 2.1)

- **2026-07-21 (P10 — OTP + Complete จอ 1.3/1.4)** — `features/auth/` OtpPage(guard pendingOtp null, chip email/ref code, OTPInput, countdown resend 60s, ปุ่มยืนยัน enable ผ่าน **regex `/^[A-Z0-9]{6}$/` (useWatch) ไม่ใช่ length**) + RegisterSuccessPage(SuccessScreen → setSession ก่อน navigate('/',{replace}) + เคลียร์ pendingOtp) + verifyOtp(MSW) + useResendCountdown. registerStore +citizenId (resend). 212 tests. consultant: **ผ่าน — core ถูก** (regex completeness, setSession→navigate order §13.1, guard, security สะอาด, no log OTP/token). review เจอ+แก้ (loop): F1 = ลบ `mode:'onChange'` (error แดงโผล่ตั้งแต่พิมพ์ตัวแรก), F2 = guard `/register/success` (!isAuthenticated→/register), +navigate replace. **notes:**
  1. **[CONTRACT — ซ้อนหนี้ P8/P9]** `POST /auth/register/verify-otp` path (probe 404) + request `{otp,refCode}` + response `{token,employee{role}}` + error codes = invented ทั้งหมด รอ swagger. schema `Employee` คัดลอกระหว่าง login.ts/verifyOtp.ts (ไม่ export ข้าม) → contract จริงมาต้องแก้ 2 จุด (`satisfies Employee` ดัก field ขาด compile-time)
  2. **[รอเคาะ policy]** countdown resend **60 วิ = นอก spec** (มี comment); OTP อายุ 15 นาที + rate limit/ชม. ยังไม่เคาะ (feature-plans/01 ท้ายไฟล์)
  3. **[Figma pass — F3]** จอ Complete ต่างจาก `3.Complete.png` (design มี gradient+โลโก้+หัวข้อ+ปุ่ม pill ขาวน้ำเงิน; เราใช้ SuccessScreen S17 เรียบ + PrimaryButton น้ำเงินทึบ) — S17 เป็น shared ใช้ร่วม clock/leave success ด้วย → เก็บ Figma pass (ขยาย SuccessScreen header slot/variant ทีเดียว); OtpPage gradient ทิศเดียวกับ P9 F7 (หนี้เดิม); ลิงก์ส่งซ้ำเป็นสีแดงหลัง OTP_EXPIRED (invent, harmless)
  4. **[follow-up เล็ก P22]** F4 เทสต์ retry ใช้ default จริง (ซ้ำ P9 F4); F5 assert payload otp สะอาดใน MSW; F6 verify-otp handler ไม่ validate body (mirror ไม่ครบ)
  5. **[fixes ผ่าน consultant รอบสอง]** F1 (ลบ mode:onChange) + F2 (guard /success) + navigate replace → 214 tests. obs minor (จด, ไม่ block): O2 = `RegisterSuccessPage` useEffect `clearPendingOtp` รันแม้ตอน guard เด้ง → deep-link /success กลาง OTP flow จะล้าง pendingOtp (ใน LIFF ไม่มี address bar โอกาสแทบศูนย์ — gate effect หลัง guard ตอนแตะไฟล์ครั้งหน้า)
