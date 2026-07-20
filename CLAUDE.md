# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

HR web app running inside **LINE LIFF** (opened from LINE OA Rich Menu) for a Thai organization.
UI language is **Thai**, mobile-first (LINE in-app browser). Buddhist Era (พ.ศ.) dates in UI.

**6 features:**

| Feature | ทำอะไร |
|---|---|
| `auth` | LIFF login → exchange ID token → app JWT; first-time register (form + **email OTP**) |
| `attendance` | clock in/out with GPS + geofence, **remote clock** (นอกสถานที่ + เหตุผล), history |
| `leave` | balance, create request (date range, half-day, แนบไฟล์, ผู้ปฏิบัติงานแทน), cancel PENDING, history |
| `approval` | manager only: pending list, approve/reject (+comment), approval history |
| `payroll` | payslip list/detail (read-only), send to registered email |
| `calendar` | leave calendar (dots by type) + company holidays |

**Detailed specs — read before implementing:**
- `docs/architecture.md` — full architecture decisions (sections referenced below as §N)
- `docs/feature-plans/00-shared-components.md` — shared UI inventory + which screens reuse what
- `docs/feature-plans/0X-<feature>.md` — per-screen plan for each feature (components, states, APIs)
- `docs/design/SME-PAYROLL/` — 37 design screenshots (PNG), grouped per feature; feature plans reference these by filename

When a task touches a feature, **read its plan file first, then open the PNG of the screen you are building** — match layout/states to the design. Do not invent screens/flows not in the plans. Exact colors/spacing come from `@theme` tokens (source of truth), not from eyeballing the PNGs. **The PNGs include a device frame, OS status bar, and the LINE LIFF header (back ‹ / title / ✕ / URL) — never implement these; LINE renders them.** Our app starts below the LIFF header. The only controllable part is the page title via `document.title` (see feature-plans/00 §0).

## Tech Stack (decided — do not change without asking)

- **Vite + React 19 + TypeScript (SPA)** — no Next.js (LIFF is client-only, no SEO, static deploy)
- **react-router-dom v7** with `createBrowserRouter` (History API — LIFF requirement)
- **TanStack Query v5** = server state · **Zustand v5** = client state (auth session, UI) — no Redux
- **axios** — single instance in `lib/api-client.ts` (interceptors attach JWT, unwrap `{data}`, normalize `ApiError`)
- **React Hook Form + Zod v4** (`z.email()` syntax, not v3) for forms
- **date-fns + locale `th`** — never moment. BE year = CE + 543 via `utils/date.ts` helpers only
- **Tailwind CSS v4** — tokens in `@theme` (styles/globals.css). **shadcn/ui selectively**: drawer, dialog, select, calendar, sonner only. Simple components (Button/Card/Badge) are hand-written from Figma
- **MSW** (`VITE_API_MOCK=true`) + **@line/liff-mock** (`VITE_LIFF_MOCK=true`) for local dev
- Backend = separate **Java EE** service (not this repo). Contract: `docs/architecture.md` §16

## Commands

```bash
npm run dev       # Vite dev server (liff-mock + MSW via .env.development)
npm run build     # tsc -b && vite build
npm run lint      # ESLint (includes import/no-restricted-paths — see rules)
npm run test      # Vitest
npm run preview
```

## Architecture

```
src/
  app/            # App.tsx, providers.tsx (LiffProvider→LiffGate→QueryClient→Router), router.tsx
  features/
    auth/  attendance/  leave/  approval/  payroll/  calendar/
      # each: api/ components/ hooks/ (stores/) (utils/) pages/ types/ index.ts
  components/     # shared UI only (S1-S18 in docs/feature-plans/00) — no business knowledge
  hooks/          # shared hooks
  lib/            # liff/ (LiffProvider, useLiff), api-client.ts, query-client.ts
  config/  stores/  types/  utils/   # utils: date.ts (formatThaiDate, countLeaveDays), currency
  mocks/          # MSW handlers per feature (mirror API contract §16.3)
```

**Iron rules (§6, ESLint-enforced):**
1. No cross-feature imports — compose at `app/` or page level. Shared code goes to `components/`/`lib/`/`utils/`
2. Unidirectional: shared → features → app. `lib/` never imports from `features/` (use setters, e.g. `setAuthToken()`)
3. Each feature exposes a minimal `index.ts` public API (no giant barrel re-exports)
4. Logic placement (§7): pure logic → `utils/*.ts` (testable, no React); React-touching → hooks. Never wrap pure functions in hooks
5. Money/quota/geofence decisions are **backend-only**; frontend values are previews (label "โดยประมาณ")

## LIFF Integration Rules (§11-13)

- Init once in `lib/liff/LiffProvider.tsx`; app renders only after `LiffGate` passes (loading/ready/**error** states — never spin forever). React 19: `<LiffContext value={...}>` is fine
- LIFF ID from `import.meta.env.VITE_LIFF_ID`. Never hardcode LIFF/channel IDs
- Endpoint URL = domain root. Rich Menu links use **`?target=attendance|leave|payroll`** query style; HomePage reads it after LiffGate and `navigate(replace:true)` against a whitelist (§12.1)
- **Auth flow (§13): exchange, don't forward.** On startup: `liff.getIDToken()` → `POST /auth/login` → backend verifies with LINE → returns **app JWT** → store in Zustand, attach via axios interceptor. Do NOT send the LIFF ID token on every request; do NOT trust `liff.getProfile()`/raw userId for authorization
- `NEED_REGISTER` response → route to `/register` (OTP flow, §3.4 + feature plan 01)
- `ID_TOKEN_EXPIRED` from backend → `liff.logout()` then `liff.login()` (page reloads with fresh token)
- Geolocation only from user actions (LIFF guideline). Use `getPositionWithRetry` (§15): `maximumAge: 0`, retry with `enableHighAccuracy: false` on timeout, map the 3 error codes to Thai messages

## API & Error Handling (§16, §20)

- Response envelope: `{ data }` / `{ error: { code, message } }`. `message` is Thai, show directly
- All errors surface as `ApiError { code, message, status }` (axios interceptor normalizes, incl. `NETWORK_ERROR`)
- Queries: error replaces content with `<ErrorState retry>`; retry 2× but never on 4xx
- Mutations: **`retry: 0` always** (clock-in must never auto-repeat); errors via sonner toast; feature-specific codes handled locally (`QUOTA_EXCEEDED` at form field, `OUT_OF_GEOFENCE` → offer remote clock, `REQUEST_NOT_PENDING` → toast + refetch)
- Error Boundaries: app-level + `errorElement` per route

## Domain Rules & Glossary

- ลงเวลา = clock in/out. **Server timestamps only** (client clock untrusted). Send `{lat,lng,accuracy,type:'onsite'|'remote',remoteReason?}`. Geofence verdict = server; client check is UX only
- การลา = leave. Types: ลาป่วย/ลากิจ/ลาพักร้อน. States: `PENDING → APPROVED | REJECTED | CANCELLED` (manager revoke of approved = open question §23, don't implement without asking)
- Half-day (เช้า/บ่าย) counts 0.5 day. `countLeaveDays` subtracts weekends **and company holidays** (from `GET /holidays`)
- หัวหน้า = manager (`role: 'manager'` in JWT). Sees only own team's leave requests; **never** team payslips/attendance. UI hides by role; backend 403 is the real guard
- สลิปเงินเดือน = payslip, read-only. Email button sends to registered email only — no email input field ever
- **Dates (§4.2):** calendar dates travel as `'YYYY-MM-DD'` strings end-to-end (parse with date-fns `parse`, never `new Date(str)`); instants are server-stamped UTC. Display via `formatThaiDate` — never scatter `+543` around the codebase

## Multi-session Workflow

Work is split into phases (context limits + usage limits). The shared brain lives in:
- `plan/plan.md` — full phase breakdown (created via `/kickoff`)
- `plan/progress.md` — **start every session by reading this file** (section 1 = bootstrap instructions, phase table with ⬜/🔄/🔍/✅ marks, "บันทึกแก้แผน" log at the bottom). Update it before ending any session
- Commands: `/kickoff` (first time — consultant surveys, main agent writes the plan), `/resume` (every later session), `/wrap-up` (stop mid-phase — save detailed state to progress.md so the next session can continue)
- Never mark a phase ✅ or start the next phase without explicit user approval

## Conventions

- TypeScript strict; no `any`. Validate API boundaries with Zod; types generated from OpenAPI when available
- PascalCase components, camelCase hooks/utils. Function components + hooks only
- Secrets: only `VITE_*` public config in env files. Envs: `.env.development` (local, mocks on) / `.env.dev` (Vercel) / `.env.uat` / `.env.production` — each env has its own LIFF ID + LINE channel (§18)
- Detailed style & testing rules are imported below — they are binding:

@.claude/rules/code-style.md
@.claude/rules/testing.md