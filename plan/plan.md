# Plan — HR LIFF App (Smart Pay Connect)

แผนเต็มสำหรับพัฒนาแบบหลาย session. ทุก session ใหม่ **เริ่มที่ `plan/progress.md`** ก่อนเสมอ แล้วค่อยเปิดเฟสที่จะทำในไฟล์นี้.

อ้างอิงหลัก: `docs/architecture.md` (§ = หัวข้อ), `docs/feature-plans/00..06`, รูป `docs/design/SME-PAYROLL/`.

---

## 0. สถานะเริ่มต้น (สำรวจโดย consultant 2026-07-21)

Repo = **Vite starter เปล่า** — ยังไม่มี dependency ของ stack แม้แต่ตัวเดียว (มีแค่ `react`/`react-dom` 19.2). เทียบ §22 คือยังไม่เริ่มขั้นที่ 1.

จุดที่ต้องรู้ก่อนลงมือ:
1. `tsconfig.app.json` **ยังไม่มี `strict: true`** และ **ไม่มี path alias `@/*`** → แก้ใน P0
2. ESLint template default — **ยังไม่มี `import-x/no-restricted-paths`** (กฎเหล็ก §6 ยังไม่บังคับ) → ตั้งใน P0 และต้องมี zones ครบ **6 features** (ตัวอย่างใน §6 มีแค่ 4 — ต้องเติม approval, calendar) *(P0: ทำเสร็จแล้ว — ใช้ `eslint-plugin-import-x` + resolver typescript, ดูบันทึกแก้แผน)*
3. **ไม่มี** `test` script (CLAUDE.md อ้าง `npm run test`) → เพิ่มใน P0
4. Assets มีแล้วบางส่วน: `src/assets/logo-smartpay.svg`, `leave/leave-{vacation,sick,personal}.png`, `gps/gps-pin.png`, `gps/gps-checked-location.png`, `thai-id/thai-id-logo.png` — **ไอคอนประเภทลาเป็น `.png` ไม่ใช่ `.svg`** (list โฟลเดอร์ก่อน import เสมอ). มีขยะ starter ต้องลบ: `react.svg`, `vite.svg`, `hero.png`, `public/icons.svg`
5. Design มี **40 PNG** (เอกสารบอก 37 — มี variant เพิ่ม: Leave `6.1`/`6.2` Create Request, Payroll `2.1` Payslip Details fullscreen)
6. ค่าสีใน feature-plans/00 §3 = **อ่านจากภาพ ยังไม่ดูดจาก Figma** → tokens ใน P1 ต้อง label placeholder + เปิดเป็นงานค้าง
7. Vite 8 / TS 6.0 / ESLint 10 ใหม่มาก — เช็ค peer dependency ทุก lib ก่อนติดตั้ง (โดยเฉพาะ `@tailwindcss/vite`, vitest กับ Vite 8, shadcn กับ React 19)

---

## 1. การตัดสินใจสถาปัตยกรรม (main agent เคาะ — รอผู้ใช้ยืนยันตอนรีวิวแผน)

| # | ประเด็น | ตัดสิน | เหตุผล |
|---|---|---|---|
| D1 | ตำแหน่ง `useHolidays` | `src/hooks/useHolidays.ts` (shared hook) | ใช้ทั้ง leave (P16) และ calendar (P17) — ถ้าอยู่ใน feature ใดจะละเมิด ESLint zone. MSW `GET /holidays` ชุดเดียว |
| D2 | `LeaveRequestCard` + `LeaveRequestDetailCard` | ยกไป `src/components/` (shared, presentational, prop-driven) | ใช้ร่วม leave + approval; ป้องกัน cross-feature import (กฎเหล็กข้อ 1) |

**เงื่อนไขบังคับ (ผู้ใช้ยืนยัน 2026-07-21) — ห้ามละเมิด:**
- **D1:** day-count เป็น **pure functions** อยู่ `utils/date.ts` (testable, ไม่แตะ React): `listLeaveWorkingDays(start,end,holidays[])` + `sumLeaveDays(days[])` — ดู "บันทึกแก้แผน P1 (leave-days redesign)". `useHolidays` เป็น **แค่ตัวห่อ** `useQuery(['holidays', year], ...)` staleTime ยาว — **ห้ามใส่ logic นับวันใน hook**
- **D2:** การ์ดทั้งสอง **presentational ล้วน** — รับ `data` + `callbacks` ผ่าน props เท่านั้น. **ห้ามมี `useQuery`/`useMutation`/navigation ข้างในการ์ด** (data-fetching + mutation + `navigate` อยู่ที่ page/feature ที่ compose การ์ด). Type `LeaveRequest` **ย้ายไป `src/types/`** (shared type — การ์ด shared ต้อง import ได้โดยไม่พึ่ง feature)
| D3 | ฟอนต์ไทย | **Kanit อย่างเดียวทั้งระบบ** — self-host woff2 ใน `src/assets/fonts/` + `@font-face` ใน globals.css (ยืนยันโดยผู้ใช้ 2026-07-21) | LINE in-app browser เน็ตวูบบ่อย — เลี่ยง CDN dependency, FOUT |

> ⚠️ ทั้ง 3 เป็น default ที่ main agent เลือก — ถ้าผู้ใช้ไม่เห็นด้วยให้แก้ก่อนเริ่ม P1/P15/P16.

---

## 1.5 Mock service + API contract (external — เพิ่มโดยผู้ใช้ 2026-07-21)

- **Mock service (hosted):** `https://infeasible-subcandidly-judie.ngrok-free.dev/`
- **Swagger UI:** `https://infeasible-subcandidly-judie.ngrok-free.dev/docs/`
- **กติกา:** โปรเจกต์นี้เป็นหลัก — **ถ้า API ขาด/ติด/ไม่ตรงกับหน้าจอที่ต้องการ ให้แจ้งผู้ใช้** (ผู้ใช้จะแก้ backend/mock ให้ตรง). ห้ามดัด frontend เลี่ยงปัญหา contract เงียบ ๆ

### ผล probe จริง (2026-07-21) — ยืนยัน contract บางส่วน + เจอ gap
- ✅ ใช้ envelope ตรง §16.1: root/error ตอบ `{"error":{"code","message"}}` (message ไทย)
- ✅ base URL **ไม่มี `/api` prefix** (routes อยู่ที่ root เช่น `/holidays`, `/auth/login`)
- ✅ `POST /auth/login` มีจริง — ต้องการ field `idToken` (`VALIDATION_ERROR: กรุณากรอก idToken`) → ตรง §13
- ✅ protected routes มีจริง (401 `UNAUTHORIZED: กรุณาเข้าสู่ระบบใหม่`): `/holidays`, `/attendance/today`, `/leave/balance`, `/payroll/payslips`
- ⚠️ **GAP — ต้องเคาะกับผู้ใช้:** `/auth/register`, `/auth/otp/request`, `/auth/otp/verify` ตอบ **404** (path จริงยังไม่รู้ — ต้องดู swagger). กระทบ P9-P10
- 🔴 **BLOCKER — ต้องแจ้งผู้ใช้:** `/docs/` Swagger UI ยัง **ไม่ถูก config** — `swagger-initializer.js` ชี้ `url: "https://petstore.swagger.io/v2/swagger.json"` (petstore demo default) และไม่มี `openapi.json` ที่ path มาตรฐานใด (`/openapi.json`, `/docs/openapi.json`, `/swagger.json` = 404). **จนกว่าจะ config ให้ชี้ spec จริง เราจะยังไม่มี machine-readable contract** — ต้อง probe เอาเองหรือรอผู้ใช้แก้

### ผลต่อ P0/env
- `.env.development`: ตั้ง `VITE_API_URL=https://infeasible-subcandidly-judie.ngrok-free.dev` เผื่อทดสอบยิง mock service จริง (สลับ `VITE_API_MOCK=false`); ค่า default ยังใช้ MSW local (`VITE_API_MOCK=true`) ตาม architecture
- axios ต้องแนบ header `ngrok-skip-browser-warning: 1` เมื่อยิงตรง ngrok (เลี่ยง interstitial ของ ngrok free) — เพิ่มใน interceptor เฉพาะเมื่อ base URL เป็น ngrok
- MSW handlers ต้อง mirror path จริง (**ไม่มี `/api` prefix**) + envelope + Thai message ตามที่ probe เจอ

---

## 2. ตารางเฟส (ภาพรวม)

หลักขนาด: **1 เฟส = 1 feature ย่อย หรือ 1 ชุด shared components** — session ที่ลื่นทำได้ 2-3 เฟสติดกัน แต่ห้ามข้ามการขอ approve ปิดเฟส.

| เฟส | ชื่อ | ผลลัพธ์หลัก | พึ่งเฟส |
|---|---|---|---|
| P0 | Project scaffold + tooling | deps ครบ, strict, alias, ESLint zones, โครงโฟลเดอร์, vitest | — |
| P1 | Tokens + globals.css + utils กลาง | `@theme`, ฟอนต์ไทย, `date.ts`/`currency.ts` + เทสต์ | P0 |
| P2 | lib ชั้น API | `api-client.ts` (ApiError/interceptor), `query-client.ts`, โครง MSW | P0 |
| P3 | LIFF shell | LiffProvider+LiffGate+liff-mock, providers, router skeleton, `?target=`, usePageTitle | P2 |
| P4 | Shared: ปุ่ม + feedback | S11-S14, S7 (sonner), S17, S18 | P1,P3 |
| P5 | Shared: list/display | S1-S6, S8-S10, S15 | P4 |
| P6 | Shared: form controls + base | hand-vendor drawer/dialog/select (vaul/Radix), TextInput/Textarea/Select/OTPInput/PeriodToggle | P4 |
| P7 | Shared: Calendar + DateRangeField | hand-vendor calendar (react-day-picker) + พ.ศ. caption + range field | P6 |
| P8 | Auth core | auth store, `login()`, setAuthToken, NEED_REGISTER/ID_TOKEN_EXPIRED, MSW auth | P3 |
| P9 | Register form | จอ 1.1 (+1.2 config mode) | P6,P8 |
| P10 | OTP + Complete | จอ 1.3, 1.4 | P9 |
| P11 | Attendance foundation | `useGeolocation`/retry, haversine, `MapView`, MSW | P3 |
| P12 | ClockPage state machine | 6 state + clock in/out onsite + remote flow + success | P11,P4 |
| P13 | Attendance history | จอ 10.History | P5,P12 |
| P14 | Leave list shell | LeaveShellPage, balance, list PENDING/history + filters, MSW leave | P5,P8 |
| P15 | Leave detail + cancel | DetailCard `owner-view`, cancel flow | P14 |
| P16 | Leave create form | LeaveForm (period รายวัน 6.1/6.2) + listLeaveWorkingDays/sumLeaveDays + holidays hook + success | P7,P14 |
| P17 | Calendar: Holidays | NextHolidayHero, list, details | P5 |
| P18 | Calendar: LeaveCalendar | custom DayButton/MonthCaption + DayDetailSheet | P7,P17 |
| P19 | Approval list | ManagerBanner, ApprovalTabs, pending+history list, role gating | P14 |
| P20 | Approval detail + ตัดสิน | approver-action/view, approve/reject, REQUEST_NOT_PENDING | P15,P19 |
| P21 | Payroll | list + detail + email (2 จอย่อย+success) | P5 |
| P22 | Hardening (กลุ่ม A: code) | verify cmd, z.iso.date sweep, interceptor, error/safe-area audit, code-split | ทุกเฟส |
| P23 | Release prep (กลุ่ม B: infra/design) | Figma tokens จริง, env DEV Vercel + LIFF ID + vercel.json, manual checklist §21.4, CI | P22 |

---

## 3. รายละเอียดต่อเฟส

### P0 — Project scaffold + tooling
- **เป้าหมาย:** เปลี่ยน starter เป็นโครงตาม CLAUDE.md โดยยังไม่มี UI จริง
- **ทำ:** ติดตั้ง deps: `react-router-dom@7, @tanstack/react-query@5, zustand@5, axios, react-hook-form, @hookform/resolvers, zod@4, date-fns, @line/liff, @line/liff-mock, tailwindcss@4 + @tailwindcss/vite, vitest, @testing-library/react, @testing-library/user-event, jsdom, msw, eslint-plugin-import-x + eslint-import-resolver-typescript` (แทน `eslint-plugin-import` ที่ peer dep รองรับแค่ ESLint ≤9 — เช็ค peer dep React 19/Vite 8 ทุกตัวก่อน); `tsconfig.app.json` เพิ่ม `"strict": true` + paths `@/*`; `vite.config.ts` alias + tailwind plugin; `eslint.config.js` เพิ่ม zones ครบ 6 features; เพิ่ม script `test`; สร้างโครง `src/app|features/{auth,attendance,leave,approval,payroll,calendar}|components|hooks|lib|config|stores|types|utils|mocks|styles`; ลบ starter (`App.css`, `index.css` เดิม, `react.svg`, `vite.svg`, `hero.png`, `public/icons.svg`); `index.html` → `lang="th"`, viewport `viewport-fit=cover`; สร้าง `.env.development` (`VITE_LIFF_ID`, `VITE_API_URL`, `VITE_LIFF_MOCK=true`, `VITE_API_MOCK=true`)
- **ไฟล์:** ราก repo + `src/**` ทั้งโครง
- **อิง:** §4-6, §18.3, §22 ขั้น 1; CLAUDE.md Commands/Architecture
- **DoD:** `npm run lint` + `tsc -b` + `npm run build` + `vitest run` (0 test ผ่านได้) ผ่านหมด; ESLint จับ cross-feature import ได้จริง (ทดลอง import ผิดต้อง error)
- **ระวัง §23:** ไม่แตะ

### P1 — Design tokens + globals + utils กลาง
- **เป้าหมาย:** `styles/globals.css` + pure utils ที่ทุก feature ใช้
- **ทำ:** `@theme` tokens ตาม feature-plans/00 §3 (primary, success, warning, danger, leave-*, holiday-*, surface, radius-card, shadow-card) **คอมเมนต์ว่า placeholder รอดูด Figma**; ฟอนต์ **Kanit อย่างเดียว** self-host woff2 (D3); safe-area utilities; `utils/date.ts` (`formatThaiDate`, **`listLeaveWorkingDays(start,end,holidays)` + `sumLeaveDays(days)`** — pure, ตาม §4.1 + บันทึกแก้แผน) + `src/types/leave.ts` (`LeaveDayPeriod`/`LeaveDayEntry`) + `utils/currency.ts` (`formatBaht`) + **เทสต์ภาคบังคับครบเคส** (listLeaveWorkingDays: วันเดียว/คร่อมเสาร์อาทิตย์/หักวันหยุด/ข้ามเดือนปี/end<start; sumLeaveDays: 0.5/เต็มวัน/ผสม 2.5)
- **ไฟล์:** `src/styles/globals.css`, `src/assets/fonts/**`, `src/utils/date.ts|.test.ts`, `src/utils/currency.ts|.test.ts`
- **อิง:** §4.1-4.2, §9.3; feature-plans/00 §3; testing.md ข้อ 1
- **DoD:** เทสต์ utils ผ่านครบ + build ผ่าน + สีเทียบ PNG ≥2 จอ (`3.Leave/1.Balance.png`, `5.Payroll/2.Payslip Details.png`)
- **ระวัง:** ค่าสีจริงจาก Figma = งานค้าง บันทึกใน progress.md

### P2 — lib ชั้น API
- **ทำ:** `lib/api-client.ts` ตาม §20.3 (ApiError, `setAuthToken`, แกะ `{data}`, `NETWORK_ERROR`, ดัก code กลาง), `lib/query-client.ts` ตาม §20.4 (query retry ไม่เอา 4xx, `mutations: {retry: 0}`), `src/mocks/browser.ts` + โครง handlers ว่างต่อ feature, เปิด MSW เฉพาะ `VITE_API_MOCK=true` ใน entry; เทสต์ interceptor 2-3 เคส
- **ไฟล์:** `src/lib/api-client.ts`, `src/lib/query-client.ts`, `src/mocks/**`, `src/main.tsx`
- **อิง:** §16.1-16.2, §19.2, §20.3-20.4
- **DoD:** มาตรฐาน + เทสต์ยืนยัน mutation default `retry: 0`

### P3 — LIFF shell (providers + router + gate)
- **ทำ:** `lib/liff/LiffProvider.tsx` (+liff-mock §19.2), `LiffGate` 3 สถานะ loading/ready/**error** (§20.2), `app/providers.tsx` (LiffProvider→LiffGate→QueryClientProvider→RouterProvider), `app/router.tsx` ทุก route ตาม §12.3 เป็น placeholder + `errorElement`, HomePage ดัก `?target=` whitelist **รวม `calendar`** (§12.1+§12.3), `hooks/usePageTitle.ts` (feature-plans/00 §0), app-level ErrorBoundary
- **ไฟล์:** `src/lib/liff/**`, `src/app/**`, `src/hooks/usePageTitle.ts`
- **อิง:** §11-12, §19, §20.1-20.2; feature-plans/00 §0
- **DoD:** `npm run dev` เปิด localhost ผ่าน liff-mock เห็น Home + navigate ทุก route placeholder; LiffGate error state ทดสอบได้ (ปิด mock ให้ init fail)
- **ระวัง:** ห้าม render router ก่อน init resolve (§12.1)

### P4 — Shared: ปุ่ม + feedback (S11-S14, S7, S17, S18)
- **ทำ:** `PrimaryButton`, `DangerSoftButton`, `GhostButton` (มี prop `shape:'card'|'pill'`), `BottomActionBar` (safe-area pb), Toast ผ่าน sonner (**`npm install sonner` ตรง ๆ + Toaster custom เอง — ไม่ใช้ shadcn CLI ที่ทับ @theme/Kanit**; pill ดำตาม design, `mobileOffset` safe-area), `SuccessScreen`, `ErrorState`/`EmptyState`
- **ไฟล์:** `src/components/**`
- **อิง:** feature-plans/00 §1 (S7, S11-S14, S17, S18), §10.2, §20.5
- **รูป:** `1.Registration/1.LINEOA-Registration.png`, `4.Leave Approval/2.Pending Details.png`, success `1.Registration/3...Complete.png`
- **DoD:** มาตรฐาน + demo render ชั่วคราวเทียบรูป (ลบก่อน commit / ใช้ route dev)

### P5 — Shared: list/display (S1-S6, S8-S10, S15)
- **ทำ:** `SegmentedTabs`(+badge), `FilterChips`, `DropdownFilter`, `StatusBadge` (4 สถานะ+สี token), `LeaveTypeIcon` (ใช้ PNG `src/assets/leave/` — **นามสกุล .png**), `ListCard`, `DetailField`, `TypeBanner`, `AttachmentItem`, `ProfileBar`
- **อิง:** feature-plans/00 §1; รูป `3.Leave/2.Pending Requests.png`, `6.Calendar/2.Holidays.png`, `5.Payroll/1.Payslip History.png`
- **DoD:** มาตรฐาน + สี StatusBadge/LeaveTypeIcon จาก token ชุดเดียว (`--color-leave-*`)

### P6 — Shared: form controls + shadcn base
- **ทำ:** **hand-vendor** drawer(vaul)/dialog+select(Radix) — copy source มา restyle ด้วย token เรา (**ห้าม `shadcn init/add` — ทับ @theme/Kanit; ผู้ใช้เคาะ P4**); form controls: `TextInput` (รองรับ mask เลขบัตร), `Textarea`, `SelectField`, `OTPInput` (6 ช่อง อักษร+เลข), `PeriodToggle` (เต็มวัน/เช้า/บ่าย — ใช้ทั้ง toggle เดียว 6.1 และแถวรายวัน 6.2) — RHF-compatible. **หมายเหตุ duality:** ช่องกรอกจอ Registration = pill, Textarea ความเห็น = rounded-rect (เหมือน button shape)
- **อิง:** feature-plans/00 §1 S16; §10.1-10.2; รูป `1.LINEOA-Registration.png`, `2...OTP.png`, `3.Leave/6.1.Create Request (1 day).png` / `6.2.Create Request (more 1 days).png`
- **DoD:** มาตรฐาน + Drawer มี `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` + ปุ่มปิด

### P7 — Shared: Calendar + DateRangeField
- **ทำ:** **hand-vendor calendar (react-day-picker)** — copy/restyle ด้วย token เรา (ห้าม shadcn CLI), custom `MonthCaption` แสดง พ.ศ. + locale th, `DateRangeField` (calendar range, ส่งค่าเป็น `'YYYY-MM-DD'` string §4.2) — แยกเฟสเพราะ §10.1 ระบุ "ยากสุดในแอปนี้"
- **อิง:** §10.3 (DayButton/MonthCaption), §4.2; รูป `6.Calendar/1.Leave Calendar.png`, `3.Leave/6.1`/`6.2`
- **DoD:** มาตรฐาน + แสดง "มิถุนายน พ.ศ. 2569" ตรงรูป + เทสต์ helper แปลง range→string

### P8 — Auth core (silent login)
- **ทำ:** `features/auth/`: store (token, employee, role), `api/login()`, flow เปิดแอป → `getIDToken` → `POST /auth/login` → JWT → `setAuthToken` (ผ่าน setter — lib ห้าม import feature), `NEED_REGISTER`→`/register`, `ID_TOKEN_EXPIRED`→`liff.logout()+liff.login()` (§13.3), `EMPLOYEE_INACTIVE`→หน้าติดต่อ HR, `ProtectedRoute`; MSW `auth.ts` (token สำเร็จ / NEED_REGISTER / expired สลับด้วย scenario)
- **อิง:** §13, §14, §16.2-16.3; feature-plans/01
- **DoD:** เปิดแอป mock → auth เงียบสำเร็จเข้าหน้าแรก; สลับ mock NEED_REGISTER → เด้ง `/register`
- **ระวัง:** ห้ามเชื่อ `liff.getProfile()` เพื่อ authorize; role จาก JWT payload

### P9 — Register form (จอ 1.1 + 1.2)
- **ทำ:** `RegisterPage` + `RegisterForm` (Zod: เลขบัตร 13 หลัก+checksum, email domain — **domain จริงยังไม่ยืนยัน** ใช้ค่าจาก config/env), ปุ่ม ThaID เป็น `GhostButton` + config `VITE_REGISTER_MODE` แต่ **ThaID ยังไม่ต่อ OAuth จริง**, error mapping (`VALIDATION_ERROR`, ไม่พบพนักงาน, `OTP_RATE_LIMITED`)
- **รูป:** `1.Registration/1.LINEOA-Registration.png`, `...Digital ID Only.png`
- **DoD:** validation ครบ + MSW request-otp + เทสต์ checksum util
- **ระวัง §23:** **ThaID phase = open question** — ห้าม implement OAuth ThaID; **email domain จริง = คำถามค้าง plan 01**

### P10 — OTP + Complete (จอ 1.3-1.4)
- **ทำ:** `OtpPage` (chip อีเมล, ref code, countdown ส่งซ้ำ, `OTP_INVALID/EXPIRED`; ใช้ `OTPInput` 6 ช่องแยก — ผู้ใช้เคาะ deviation จาก PNG กล่องเดียว), `RegisterSuccessPage` → `navigate('/', {replace:true})` เก็บ token จาก verify-otp ลง store
- **รูป:** `2.LINEOA-Registration-OTP.png`, `3.LINEOA-Registration-Complete.png`
- **DoD:** flow ครบวงบน mock + เทสต์ error path 1 เคส (OTP ผิด) + mutation ไม่ auto-retry

### P11 — Attendance foundation (GPS + Map)
- **ทำ:** `hooks/useGeolocation.ts` + `getPositionWithRetry` ตาม §15 (maximumAge:0, retry ลด accuracy, map 3 error→ไทย) + เทสต์ (mock navigator.geolocation); `utils/haversine.ts` (preview) + เทสต์; `MapView` interface กลาง (`userPos, officePos, radiusMeters`) เริ่มด้วย **MapLibre + tile ฟรี** สลับ provider ได้; กติกา init ครั้งเดียว/`panTo`; MSW `GET /attendance/today`
- **อิง:** §15, §23.2#3; feature-plans/02
- **DoD:** เทสต์ geolocation retry + haversine ผ่าน; map แสดงหมุด 2 ตัว + วงรัศมีตรงรูป `2.Attendance/1.Clock In - Within Range (Ready).png`
- **ระวัง §23:** **map provider ยังไม่เคาะ (23.2#3)** — ห้ามผูก Google key; ปุ่ม "โหลดแผนที่ใหม่" = ขอ GPS ใหม่+panTo ห้าม re-init

### P12 — ClockPage state machine (จอ 0-9)
- **ทำ:** `useAttendanceState()` derive จาก today + geofence client (UX เท่านั้น), 6 state ตาม plan 02, `ClockButton`/`ClockDock`/`RangeStatusPill`/`RemoteModePill`/`RemoteReasonSheet` (Drawer)/`ClockSuccessOverlay`, clock-in/out ส่ง `{lat,lng,accuracy,type,remoteReason?}`, error: `OUT_OF_GEOFENCE`→สลับ out-of-range+เสนอ remote, `ALREADY_CLOCKED_IN`→refetch; MSW clock-in/out รวมเคส error
- **รูป:** `2.Attendance/0-9*.png` ครบชุด
- **DoD:** เดินครบทุก state บน mock; เทสต์ ClockButton disabled ระหว่าง `isPending` + ไม่ retry; server ตัดสิน geofence (client แค่ preview)
- **ระวัง §23:** **remote clock policy (23.1#4) ยังไม่เคาะ** — implement ตาม design (กรอกเหตุผล+บันทึกพิกัด) + เผื่อ flag `canRemoteClock` แต่**ห้ามทำ flow แจ้งเตือน/รับทราบหัวหน้าเอง**

### P13 — Attendance history (จอ 10)
- **ทำ:** `/attendance/history`: DropdownFilter ปี/เดือน + ListCard ต่อวัน (เข้า-ออก, onsite/remote, ปกติ/มาสาย) + Empty/Error; MSW history
- **รูป:** `2.Attendance/10.History.png`
- **DoD:** มาตรฐาน + ป้าย "มาสาย" จาก server ไม่คำนวณเอง

### P14 — Leave list shell (จอ 3.1-3.3)
- **ทำ:** `LeaveShellPage` (**ฝั่งพนักงานล้วน:** balance เป็น view เริ่มต้น + **แถบล่าง** SegmentedTabs สลับ pending/history ของตัวเอง — ~~SegmentedTabs บน + แท็บ manager placeholder~~ **[SUPERSEDED 2026-07-22: อ่าน design ผิด — แท็บบน "การลาของฉัน\|รออนุมัติ" คือจอ manager เท่านั้น (P19), ไม่มีในจอพนักงาน; manager compose ที่ `app/` ตอน P19]**), `LeaveBalanceCard`×3 label "คงเหลือ (โดยประมาณ)", list `LeaveRequestCard` (prop `showEmployeeName`) + FilterChips + DropdownFilter, types/api/hooks + MSW leave (balance, requests)
- **รูป:** `3.Leave/1.Balance.png`, `2.Pending Requests.png`, `3.History.png`
- **DoD:** มาตรฐาน + history/pending หน้าเดียวเปลี่ยน query (plan 03 §3.3)
- **หมายเหตุ D2:** `LeaveRequestCard` อยู่ `src/components/` (shared) — **presentational ล้วน: รับ data+callbacks ผ่าน props, ห้าม useQuery/useMutation/navigate ในการ์ด** (data-fetching + onClick→navigate อยู่ที่ `LeaveShellPage`). Type `LeaveRequest` อยู่ `src/types/` (**ประกาศครั้งแรกที่เฟสนี้ ที่ `src/types/` ไม่ใช่ใน feature**)

### P15 — Leave detail + cancel (จอ 3.4, 3.8, 3.9)
- **ทำ:** `LeaveRequestDetailCard` (**ใช้ร่วม 5 จอ — อยู่ `src/components/` ตาม D2, presentational ล้วน: รับ data+callbacks props เท่านั้น, ห้าม useQuery/useMutation/navigate ในการ์ด**) mode `owner-view` ก่อน, `LeaveDetailPage` (**page เป็นที่อยู่ของ useQuery รายละเอียด + useMutation cancel + navigate**), `CancelConfirmSheet` → `POST .../cancel` → toast แดง + invalidate; `REQUEST_NOT_PENDING`→toast+refetch
- **รูป:** `3.Leave/4.History Details.png`, `8. Sended Pending Details.png`, `9. Sended Cancel Pending Request.png`
- **DoD:** มาตรฐาน + เทสต์ DetailCard render ปุ่มถูกชุดตาม mode (testing.md ข้อ 3)
- **ระวัง §23:** **จอ 3.5 Editable = open question 23.1#5 — ห้ามทำปุ่ม/flow แก้ไขใบลา** ทำเฉพาะยกเลิก (จดถามผู้ใช้)

### P16 — Leave create form (จอ 3.6-3.7 + variant 6.1/6.2)
- **ทำ:** `LeaveForm` (RHF+Zod v4): เลือกประเภท (การ์ด 3 ใบ) → DateRangeField → **ช่วงเวลา period รายวัน (6.1/6.2):** วันเดียว = toggle เดียว (เต็มวัน/เช้า/บ่าย); หลายวัน = render แถวต่อวันจาก `listLeaveWorkingDays(start,end,holidays)` (วันเสาร์อาทิตย์/วันหยุด = แถว disabled "วันหยุด" ไม่นับ) → รวมวัน preview จาก `sumLeaveDays(days)` → เหตุผล → แนบไฟล์ (multipart) → ผู้ปฏิบัติงานแทน → ผู้อนุมัติ auto; ส่ง `days:[{date,period}]`; Zod = ด่านเข้ม (days ครบทุกวันทำงาน); `QUOTA_EXCEEDED` โชว์ที่ช่องวันที่; holidays ผ่าน `src/hooks/useHolidays.ts` (D1 — แค่ห่อ `useQuery(['holidays', year])`)
- 🔮 **ห้ามทำดักไว้:** ฟีเจอร์ "ลบวันรายแถว" (โครง days[] รองรับแล้ว รอนโยบาย+design — ดู architecture §16.3)
- **รูป:** `3.Leave/6.1.Create Request (1 day).png`, `6.2.Create Request (more 1 days).png`, `7.Create Request - Success.png`
- **DoD:** เทสต์ LeaveForm validation + QUOTA_EXCEEDED ถูกช่อง; วันที่ใน payload เป็น string `YYYY-MM-DD`
- **ระวัง §23:** **"ผู้ปฏิบัติงานแทน" ไม่มี endpoint ใน contract** (plan 03 คำถาม 2) — mock `GET /employees/teammates` + จดเป็นงานเคาะ contract; อย่าตัดสินเองว่าเลือกได้ทั้งบริษัท

### P17 — Calendar: Holidays (จอ 6.2-6.3)
- **ทำ:** `CalendarShellPage` (SegmentedTabs ปฏิทินการลา|วันหยุด), `NextHolidayHero` (นับถอยหลัง client — แสดงผลล้วน), list `HolidayListItem` + token `--color-holiday-*`, `HolidayDetails` จาก payload เดิม; MSW `GET /holidays?year=` (**ชุดเดียวกับ P16 ใช้ผ่าน `useHolidays`**)
- **รูป:** `6.Calendar/2.Holidays.png`, `3.Holiday Details.png`
- **DoD:** มาตรฐาน + cache ปีละครั้ง

### P18 — Calendar: LeaveCalendar (จอ 6.1)
- **ทำ:** `LeaveCalendar` ตามโค้ด §10.3 (custom DayButton จุดสีตามประเภท ≤3 จุด, MonthCaption พ.ศ.), `CalendarLegend`, `LeaveDayDetailSheet` (Drawer — จอนี้ไม่มีใน design, ทำตาม §10.3 + จดให้ designer เติม), MSW `GET /leave/calendar?month=` + `/{date}`
- **รูป:** `6.Calendar/1.Leave Calendar.png`
- **DoD:** จุดสีตรง token `--color-leave-*` เดียวกับ LeaveTypeIcon
- **ระวัง:** ชั้น detail เปิดข้อมูลสุขภาพ — frontend render ตามที่ API คืน (กรอง role อยู่ backend §10.3)

### P19 — Approval list (จอ 4.1, 4.4)
- **ทำ:** **แท็บบนสุด "การลาของฉัน | รออนุมัติ(n)" บน `/leave` — compose ที่ `app/` (สร้าง `LeaveRoute.tsx` แบบ `AttendanceRoute`; router เปลี่ยน `/leave` จาก import barrel ตรงเป็นผ่าน route component; กฎเหล็ก §6 ห้าม `LeaveShellPage` import approval)**, render เฉพาะ `role==='manager'`; `ManagerBanner`, `ApprovalTabs` (รออนุมัติ(n)|ประวัติ + badge **จาก `GET /approval/pending` — คนละ query กับแถบล่างฝั่งพนักงาน `GET /leave/requests?status=PENDING`**), list reuse `LeaveRequestCard showEmployeeName` (shared ตาม D2), role gating UI + backend 403 เป็นตัวจริง; MSW approval
- **รูป:** `4.Leave Approval/1.Pending List.png`, `4.History.png`
- **DoD:** มาตรฐาน + non-manager ไม่เห็นแท็บ

### P20 — Approval detail + approve/reject (จอ 4.2-4.3, 4.5-4.7)
- **ทำ:** DetailCard mode `approver-action` (comment) + `approver-view`; approve `{comment?}` / reject บังคับเหตุผล (validate ก่อนส่ง); toast เขียว/แดง + invalidate pending+history; `REQUEST_NOT_PENDING`→toast+refresh
- **รูป:** `2.Pending Details.png`, `3.Approve - Success.png`, `5.History Details - Approved.png`, `6...Read Only.png`, `7.Reject - Success.png`
- **DoD:** เทสต์ reject บังคับเหตุผล + ปุ่ม disabled ตอน isPending
- **ระวัง §23:** **ปุ่ม "ยกเลิกคำขอ" จอ 4.5 = revoke = open question 23.1#6 — ห้าม implement** ทำ prop `canRevoke` default `false` (จอ 4.6 read-only ใช้ไปก่อน) + จดถามผู้ใช้; **หลายชั้นอนุมัติ/หัวหน้าลาใครอนุมัติ (23.1#1-2) ห้ามออกแบบเผื่อ** — frontend ทำชั้นเดียวตาม design

### P21 — Payroll (จอ 5.1-5.3 + 2.1 fullscreen)
- **ทำ:** `PayslipListPage` (ProfileBar + filter ปี + ListCard), `PayslipDetailPage` (`PayslipSummaryHero`, `PayslipSection` — รายรับ/รายหักเป็น array `{label,amount}` จาก API ห้าม hardcode, `formatBaht`/`formatThaiDate` เท่านั้น), ปุ่มส่งอีเมล → `POST .../email` **ไม่มี input อีเมล** + disabled ระหว่างส่ง + toast; เช็ครูป `2.1 fullscreen` ว่าเป็นแค่ scroll เต็มหน้า
- **รูป:** `5.Payroll/1-3*.png`
- **DoD:** มาตรฐาน + ไม่มี log ตัวเลขเงินลง console + เทสต์ email mutation ไม่ retry
- **ระวัง:** เข้มสิทธิ์สุด — read-only, ตัวตนจาก JWT เท่านั้น

### P22 — Hardening (กลุ่ม A: code) ✅
- **ทำแล้ว (2026-07-22):** (1) verify command → `npm run typecheck` (`tsc -p tsconfig.app.json`); (2) `z.iso.date()` sweep §4.2; (3) interceptor `res.data?.data`; (4) audit `errorElement`+ErrorBoundary 2 ระดับ / mutation `retry:0`+disabled / safe-area Drawer+BottomActionBar / `document.title` ทุก route / ลบ demo/console (ครบ ไม่มี gap); (5) code-split route-lazy (bundle 946→530KB); (6) follow-up cheap + doc notes
- **DoD:** lint 0 · `tsc -p tsconfig.app.json` 0 · test 495 · build ✓ — **ผ่าน** (worker→consultant PASS)
- รายละเอียด + หนี้เลื่อน (submittedAt/approvedAt รอ swagger ฯลฯ) ดู progress.md บันทึกแก้แผน P22

### P23 — Release prep (กลุ่ม B: infra/design)
- **ทำ:** (1) **Figma color tokens จริง** แทน placeholder `--color-*`/`--color-leave-*`/`--color-holiday-*`/`--color-toast-bg` (§9.5) — ต้องมีค่าจริงจาก Figma; (2) **env DEV Vercel + LIFF ID จริงต่อ env** (§18) + `vercel.json` rewrites (SPA) + Vercel setup §19.3 — LIFF ID จริงจากผู้ใช้; (3) **manual device checklist §21.4** เครื่องจริง iOS+Android (map/GPS/toast ตำแหน่ง/iOS zoom-on-focus/JWT หมดอายุกลางคัน/Drawer swipe/ปลายหมุด GPS/non-manager deep-link `/approval/:id` เด้ง); (4) CI (`vitest run` + `tsc -p tsconfig.app.json` + eslint) — ถ้าจะตั้ง GitHub Actions
- **ทำเองได้เลย (ไม่ต้องรอค่าจริง):** ร่าง `vercel.json` + `.env.dev` skeleton (ค่า LIFF ID เว้น placeholder), ร่าง manual checklist §21.4, CI workflow
- **ต้องพึ่งผู้ใช้:** ค่า Figma tokens จริง, LIFF ID จริงต่อ env, รันเทสต์บนเครื่องจริง
- **DoD:** ทดสอบบน Vercel dev เครื่องจริง ≥1 platform; checklist §21.4 ครบ
- **ระวัง §23:** **infra UAT/PRD (23.2) ยังไม่เคาะ** — deploy ได้แค่ DEV Vercel; ห้ามตั้ง UAT/PRD เอง; Sentry ยัง optional (§20.5)

---

## 4. Open Questions §23 — เดินอ้อมไว้ (เตือนซ้ำใน progress.md)

| Open Q | เฟสเสี่ยง | ท่าที่ใช้ |
|---|---|---|
| ThaID phase (plan 01) | P9 | ปุ่มตามรูปแต่ไม่ต่อ OAuth / ซ่อนด้วย config |
| Email domain องค์กร (plan 01) | P9 | ค่า config รอยืนยัน |
| Remote clock policy (23.1#4) | P12 | ตาม design + flag `canRemoteClock` — ไม่มี flow รับทราบ |
| แก้ไขใบลา PENDING (23.1#5) | P15 | ไม่ทำปุ่มแก้ไข — cancel เท่านั้น |
| Revoke ใบอนุมัติแล้ว (23.1#6) | P20 | `canRevoke=false` — ไม่ทำ endpoint |
| Teammates endpoint (plan 03) | P16 | mock ไว้ + รอเคาะ contract |
| Map provider (23.2#3) | P11-P12 | `MapView` interface + MapLibre ก่อน |
| Infra UAT/PRD (23.2#1-2) | P23 | DEV Vercel เท่านั้น |

## 5. Definition of Done มาตรฐาน (ทุกเฟส)
- `npm run lint` ผ่าน (รวม `import-x/no-restricted-paths`)
- `tsc -b` / `tsc --noEmit` ผ่าน (strict, ไม่มี `any`)
- `npm run test` (vitest) ผ่าน — utils ใหม่ทุกตัวมีเทสต์
- `npm run build` ผ่าน
- เทียบ layout/state กับ PNG ของจอที่ทำ
- worker เสร็จ → consultant review → main agent verify (lint+build) → สรุป → **รอผู้ใช้เคาะ**
