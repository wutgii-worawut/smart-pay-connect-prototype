# SmartPay Connect — HR on LINE LIFF

เว็บแอป HR สำหรับพนักงาน เปิดใช้งานผ่าน **LINE OA Rich Menu → LINE LIFF** (mobile-first, UI ภาษาไทย, ปี พ.ศ.)

| Feature | ความสามารถ |
|---|---|
| ลงทะเบียน (auth) | ผูกบัญชี LINE ↔ พนักงาน ครั้งเดียว (ฟอร์ม + OTP อีเมล) จากนั้น login อัตโนมัติ |
| ลงเวลา (attendance) | เข้า-ออกงานด้วย GPS + geofence, ลงเวลานอกสถานที่ (พร้อมเหตุผล), ประวัติ |
| ลา (leave) | ดูโควตา, ยื่นลา (ช่วงวัน/ครึ่งวัน/แนบไฟล์/ผู้ปฏิบัติงานแทน), ยกเลิกใบรออนุมัติ, ประวัติ |
| อนุมัติ (approval) | เฉพาะหัวหน้า: รายการรออนุมัติของลูกทีม, อนุมัติ/ไม่อนุมัติ + ความเห็น, ประวัติ |
| สลิปเงินเดือน (payroll) | ดูสลิปย้อนหลัง (read-only), ส่งเข้าอีเมลที่ลงทะเบียน |
| ปฏิทิน (calendar) | ปฏิทินการลา (จุดสีตามประเภท) + วันหยุดบริษัท/นักขัตฤกษ์ |

> Backend เป็น service แยก (Java EE — ไม่อยู่ใน repo นี้) repo นี้คือ **frontend เท่านั้น**

## Tech Stack

Vite · React 19 · TypeScript (strict) · React Router v7 · TanStack Query v5 · Zustand v5 ·
axios · React Hook Form + Zod v4 · date-fns (locale `th`) · Tailwind CSS v4 (+ shadcn/ui บางตัว) ·
MSW + `@line/liff-mock` (dev) · Vitest + Testing Library

## เริ่มต้น (Local Development)

```bash
npm install
cp .env.example .env.development   # ถ้ายังไม่มี — ดูตัวแปรด้านล่าง
npm run dev                        # http://localhost:5173
```

`.env.development` สำหรับ dev บนเครื่อง (เปิด mock ทั้งคู่ — ไม่ต้องแตะ LINE/backend จริง):

```
VITE_LIFF_ID=<dev liff id>
VITE_API_URL=http://localhost:8080
VITE_LIFF_MOCK=true    # จำลอง LIFF SDK — ทำให้รันบน localhost ได้
VITE_API_MOCK=true     # เปิด MSW — mock API ตาม contract
```

- ทดสอบ **ใน LINE จริง**: push ขึ้น branch `dev` → Vercel deploy อัตโนมัติ → เปิด
  `https://liff.line.me/{dev-liff-id}?target=attendance` จากมือถือ (ลิงก์อยู่ในกลุ่ม LINE ทีม)
- ทดสอบ GPS บนเครื่อง: Chrome DevTools → Sensors → override พิกัด

## คำสั่ง

```bash
npm run dev        # dev server (mock LIFF + MSW)
npm run build      # tsc -b && vite build → dist/
npm run lint       # ESLint (บังคับกฎ import ข้าม feature)
npm run test       # Vitest
npm run preview
```

## โครงสร้างโปรเจกต์ (feature-based)

```
src/
  app/            # providers (LiffProvider→LiffGate→Query→Router), router
  features/       # auth / attendance / leave / approval / payroll / calendar
                  #   แต่ละตัว: api/ components/ hooks/ pages/ types/ index.ts
  components/     # shared UI ล้วน (ไม่รู้ business)
  lib/            # liff/, api-client.ts (axios), query-client.ts
  utils/          # date.ts (พ.ศ., นับวันลา), currency
  mocks/          # MSW handlers ตาม API contract
docs/
  architecture.md          # การตัดสินใจสถาปัตยกรรมทั้งหมด (23 หัวข้อ)
  feature-plans/           # แผนต่อหน้าจอ + ตาราง shared components
  design/SME-PAYROLL/      # รูป design 37 หน้าจอ
plan/
  plan.md / progress.md    # แผนแบ่งเฟส + สถานะงาน (ข้าม session)
```

กฎเหล็กย่อ: ห้าม import ข้าม feature · server state = TanStack Query เท่านั้น ·
วันปฏิทินเป็น string `YYYY-MM-DD` · เงิน/โควตา/geofence ตัดสินที่ backend เท่านั้น ·
สี/spacing ใช้ token จาก `@theme` — ฉบับเต็ม: `CLAUDE.md` + `.claude/rules/`

## Environments

| | DEV | UAT | PRD |
|---|---|---|---|
| Hosting | Vercel (branch `dev`) | TBD | TBD |
| LIFF ID / LINE channel | แยกชุดของตัวเอง | แยกชุด | แยกชุด |
| env file | `.env.dev` | `.env.uat` | `.env.production` |

Secrets (channel ID, JWT secret) อยู่ฝั่ง backend เท่านั้น — ใน repo นี้มีได้เฉพาะค่า `VITE_*`

## การพัฒนาโดยใช้ Claude Code

โปรเจกต์นี้ตั้งค่า Claude Code ไว้ครบ (`CLAUDE.md`, `.claude/agents|rules|commands`):

| คำสั่ง | ใช้ตอน |
|---|---|
| `/kickoff` | ครั้งแรก — สำรวจ+สร้างแผนแบ่งเฟสลง `plan/` |
| `/resume` | ทุก session — อ่าน `plan/progress.md` แล้วทำเฟสถัดไป (worker → consultant รีวิว → verify → รอเคาะ) |
| `/wrap-up` | ต้องหยุดกลางเฟส — เก็บสถานะละเอียดให้ session หน้าทำต่อได้ |
| `/new-feature-page` | งานจรชิ้นเดียวนอกแผน |

## เอกสารที่ควรอ่านก่อนแตะโค้ด

1. `docs/architecture.md` — เหตุผลทุกการตัดสินใจ + Open Questions (§23 = เรื่องที่ยังไม่เคาะ ห้าม implement เอง)
2. `docs/feature-plans/00-shared-components.md` — component ไหนมีอยู่แล้ว ห้ามสร้างซ้ำ
3. `docs/feature-plans/0X-<feature>.md` + รูปใน `docs/design/` — ก่อนทำหน้าจอใด ๆ