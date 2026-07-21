# Progress — HR LIFF App

## 1. สำหรับ session ใหม่: เริ่มตรงนี้ก่อน

### 1.1 สถานะปัจจุบัน
- **2026-07-21** — **P0 ✅** · **P1 ✅** · **P2 ✅** · **P3 ทำเสร็จ+consultant รีวิว 2 รอบ ผ่าน รอผู้ใช้เคาะ (🔍)**.
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
- **P4 — Shared: ปุ่ม + feedback** (plan.md §3 → P4). เริ่มเมื่อผู้ใช้เคาะ P3. S11-S14 (ปุ่ม), BottomActionBar (safe-area), Toast (sonner), SuccessScreen, ErrorState/EmptyState. เทียบรูปปุ่มใน design.

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
| P1 | Tokens + globals.css + utils กลาง | ✅ | เคาะแล้ว 2026-07-21 · สียัง placeholder รอ Figma (ใช้ตามนี้ก่อน) |
| P2 | lib ชั้น API | ✅ | consultant 2 รอบ + เคาะแล้ว 2026-07-21 |
| P3 | LIFF shell | 🔍 | เสร็จ+consultant 2 รอบ (41 tests) รอผู้ใช้เคาะ |
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
