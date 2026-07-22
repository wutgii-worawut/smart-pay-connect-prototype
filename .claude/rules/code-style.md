# Code Style Rules

กฎบังคับสำหรับโค้ดทุกไฟล์ใน repo นี้ — อ้างอิง `docs/architecture.md` (§ = หัวข้อในนั้น)

## TypeScript

- `strict: true` คงไว้เสมอ — **ห้าม `any`**; ถ้าจำเป็นจริงใช้ `unknown` + narrow
- Type ของ API request/response มาจาก OpenAPI-generated types (เมื่อมี) หรือประกาศใน `features/<x>/types/` ให้ตรง contract §16.3 — validate runtime ด้วย Zod ที่ boundary
- Zod เป็น **v4**: `z.email()`, `z.iso.date()` — ห้ามใช้ syntax v3 (`z.string().email()`)
- ห้าม type assertion (`as`) เพื่อปิด error — แก้ที่ต้นเหตุ

## การวางไฟล์ / import (ESLint บังคับ — §6)

- ห้าม import ข้าม `features/*` — ของร่วมยกไป `src/components|hooks|lib|utils`
- `lib/` และ shared ห้าม import จาก `features/` — ใช้ setter/callback แทน (เช่น `setAuthToken()`)
- Component รู้ business ของ feature ไหน → อยู่ feature นั้น; UI ล้วน → `src/components/`
- Pure function (ไม่มี React) → `utils/*.ts` — ห้ามห่อเป็น hook; hook เฉพาะของที่แตะ React (§7)
- ไฟล์ component = PascalCase.tsx, hooks = useXxx.ts, utils = camelCase.ts
- **รูปภาพ**: ใช้ร่วมหลาย feature → `src/assets/` / เฉพาะ feature → `features/<x>/assets/` —
  **import ในโค้ดเสมอ** (`import logo from '@/assets/logo-smartpay.svg'`) ห้าม hardcode path จาก `public/`
  (`public/` มีแค่ favicon/og-image) — SVG เมื่อทำได้; ถ้าเป็น raster (PNG ฯลฯ) ต้องพื้นโปร่งใส + กว้าง ≥2× ขนาดแสดงจริง; ชื่อ kebab-case
- **ก่อน import รูปทุกครั้ง ให้ list โฟลเดอร์ดูไฟล์จริงก่อน** (`ls src/assets/` หรือ Glob) แล้วใช้
  **นามสกุลตามที่มีอยู่** — ห้ามเดา/พิมพ์จากความจำ (เดาผิดนามสกุลเดียว build พัง) —
  ถ้าไฟล์ที่ต้องใช้ยังไม่มีในโฟลเดอร์ ให้รายงานว่าขาด asset อะไร ไม่ใช่สร้าง placeholder เอง

## React

- Function components + hooks เท่านั้น; React 19 (`<Context value>` ใช้ได้ตรง ๆ)
- Server state อยู่ TanStack Query เท่านั้น — ห้าม copy ผลลง `useState`
- Client state ข้าม component → Zustand; ใน component เดียว → `useState`
- Mutation ทุกตัว `retry: 0` + ปุ่ม disabled ระหว่าง `isPending`
- ฟอร์มใช้ React Hook Form + `zodResolver` — ห้าม controlled state เอง

## Styling (Tailwind — §9)

- สี/spacing/radius ใช้ **token จาก `@theme` เท่านั้น** — ห้าม arbitrary color (`bg-[#xxx]`)
  ยกเว้นค่าที่ใช้ครั้งเดียวจริงและมีคอมเมนต์กำกับ
- `styles/globals.css` เป็น CSS global ไฟล์เดียว (tokens, ฟอนต์ไทย, safe-area, reset)
- ห้ามสร้าง `.module.css` ยกเว้น component ที่ CSS ซับซ้อนจริง และต้องอยู่ในโฟลเดอร์ feature เดียวกัน
- Class ซ้ำเกิน 2-3 ที่ → ยกเป็น shared component ห้าม copy
- Bottom sheet/Drawer ต้องมี `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` + ปุ่มปิดชัดเจนเสมอ (§10.2)
- สีประเภทลาใช้ token `--color-leave-*` ชุดเดียวทุกที่ (icon, จุดปฏิทิน, legend)

## วันที่ / เงิน (§4.1-4.2)

- วันในปฏิทินรับ-ส่งเป็น string `'YYYY-MM-DD'`; parse ด้วย `parse(str,'yyyy-MM-dd',new Date())`
  — **ห้าม `new Date('2026-07-01')`** (ได้เที่ยงคืน UTC)
- แสดงผล พ.ศ. ของ **calendar date** (`'YYYY-MM-DD'`) ผ่าน `formatThaiDate()` ใน `utils/date.ts` เท่านั้น — ห้ามบวก 543 กระจายตามหน้า
- **instant** (ISO 8601 UTC เช่น `submittedAt`/`approvedAt`/เวลาลงเวลา) แสดงผลผ่าน `formatThaiInstant()` เท่านั้น (แปลงเป็นวันไทย +7 คงที่) — **ห้ามส่ง instant เข้า `formatThaiDate`** (`parse('...T..Z','yyyy-MM-dd')` = Invalid Date → `format()` throw ทั้งจอ, §4.2 แยก 2 ชนิดห้ามปน)
- จำนวนเงิน format ผ่าน `formatBaht()` เท่านั้น
- ห้ามใช้ moment / dayjs — date library เดียวคือ date-fns

## ภาษาไทยใน UI

- ข้อความผู้ใช้ทั้งหมดเป็นภาษาไทย (error message จาก `ApiError.message` แสดงตรง ๆ ได้)
- ตัวเลขคาดการณ์ต้อง label กำกับ เช่น "คงเหลือ (โดยประมาณ)" (§7.4)

## ความปลอดภัย

- ห้าม log token/JWT/พิกัด/เงินเดือน ลง console ใน production path
- ห้ามส่งอีเมลปลายทาง/userId จาก client ให้ backend ตัดสินใจ — backend ใช้ตัวตนจาก JWT เท่านั้น
- ห้าม hardcode LIFF ID, channel ID, URL environment — ใช้ `import.meta.env.VITE_*`