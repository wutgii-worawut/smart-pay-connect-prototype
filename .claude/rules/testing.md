# Testing Rules

แนวทางเทสต์ของ repo นี้ (จาก `docs/architecture.md` §21) — ทีมเล็ก: test ที่คุ้มก่อน ไม่ไล่ coverage

## เครื่องมือ

- **Vitest** + **@testing-library/react** + **@testing-library/user-event**
- Mock API ด้วย **MSW ชุดเดียวกับ dev** (`src/mocks/handlers/`) — ห้ามเขียน mock fetch/axios เอง
  ต่อเทสต์ เพื่อให้ mock กับ dev พูด contract (§16.3) เดียวกันเสมอ
- ไฟล์เทสต์วางคู่ไฟล์จริง: `leave-days.ts` → `leave-days.test.ts`

## อะไรต้องเทสต์ (เรียงตามบังคับ → เลือก)

1. **ภาคบังคับ — pure functions ใน `utils/` ทุกตัว** โดยเฉพาะ:
   - `listLeaveWorkingDays`: วันเดียว, คร่อมเสาร์อาทิตย์, หักวันหยุดบริษัท, ข้ามเดือน/ปี, ช่วงกลับด้าน (end<start → [])
   - `sumLeaveDays`: ครึ่งวัน (0.5), เต็มวัน (1), ผสม (เช่น [full,am,full]=2.5), ว่าง (→0)
   - `formatThaiDate` / `formatBaht`
   - ทุก logic ที่แตะเงิน/โควตา/เวลา
2. **เลือกทำ — hooks ที่มีเงื่อนไข**: `useGeolocation` (retry + error 3 code),
   flow `useSubmitLeave` (ผ่าน `renderHook` + MSW)
3. **เลือกทำ — components critical เท่านั้น**:
   - `LeaveForm` — validation + `QUOTA_EXCEEDED` โชว์ถูกช่อง
   - `ClockButton` / attendance state machine — สถานะ in-range/out-of-range/remote/`isPending` disabled
   - `LeaveRequestDetailCard` — 3 mode render ปุ่มถูกชุด
4. **ข้าม**: pages, layout, component แสดงผลล้วน
5. **E2E automation: ยังไม่ทำ** (LIFF ใน LINE in-app browser automate ไม่ได้ — §21.6)
   แทนด้วย **manual device checklist** (§21.4) บนเครื่องจริง iOS + Android ก่อน release ทุกครั้ง
   - เมื่อ flow นิ่งแล้วจึงพิจารณาขั้น 2: Playwright desktop + liff-mock + MSW จำกัด 3-5 flow หลัก
     — ต้องถามผู้ใช้ก่อนเริ่ม ห้ามตัดสินใจเพิ่มเอง

## กติกาการเขียนเทสต์

- เทสต์พฤติกรรมผ่านสิ่งที่ผู้ใช้เห็น (Testing Library queries by role/text ภาษาไทย) — ไม่เทสต์ internal state
- Mutation ต้องมีเทสต์ยืนยันว่า **ไม่ retry อัตโนมัติ** และปุ่ม disabled ระหว่างส่ง
- เทสต์ error path อย่างน้อยหนึ่งเคสต่อ mutation (ใช้ MSW handler ตอบ `{error:{code,message}}`)
- วันที่ในเทสต์ fix เป็นค่าคงที่ (ห้ามพึ่ง `new Date()` จริง) — ใช้ `vi.setSystemTime` เมื่อจำเป็น
- เทสต์ต้อง deterministic — ห้ามพึ่ง network จริง, timezone เครื่อง (กติกา string date §4.2 ช่วยอยู่แล้ว)

## Definition of Done ต่อ PR

- [ ] `npm run test` ผ่าน (utils ใหม่ทุกตัวมีเทสต์)
- [ ] `npm run lint` + `tsc --noEmit` ผ่าน
- [ ] feature ที่กระทบ UI มือถือ → ทดสอบผ่าน Vercel dev บนเครื่องจริงอย่างน้อย 1 platform
- [ ] ก่อน release สู่ UAT/PRD → manual checklist §21.4 ครบทั้ง iOS และ Android
