# 06 — Calendar (ปฏิทินการลา + วันหยุด) — 3 หน้าจอ

> โฟลเดอร์: `features/calendar/` | อ้างอิงเอกสารหลัก: 10.3 (case study LeaveCalendar + demo jsx), 3.5 (holidays), 16.3 (API)
> Shell เดียว สลับด้วย `SegmentedTabs` (S1): **ปฏิทินการลา | วันหยุด**

## หน้าจอ

### 6.1 Leave Calendar — `1.Leave Calendar.png`
- ตรงกับ demo ที่สร้างไว้แล้ว (`leave-calendar-demo.jsx`): header เดือนไทย + พ.ศ. + ปุ่ม ‹ › → แถวชื่อวัน อา.-ส. (วันหยุดสีเทา) → grid วันพร้อม**จุดสีตามประเภทลา** (วันนี้/วันเลือก = วงเขียว) → **legend** ล่าง: ● ลาพักร้อน ● ลาป่วย ● ลากิจ
- Implement จริง: shadcn Calendar (react-day-picker) + custom `DayButton` + custom `MonthCaption` (พ.ศ.) ตามโค้ดเอกสารหลัก 10.3
- กดวัน → เปิด `LeaveDayDetailSheet` (Drawer) รายละเอียดใครลา — **design ไม่มีจอนี้** แต่ตกลงกันไว้แล้ว (10.3) → **ทำ Drawer ตามแบบแผนเดิม + ให้ designer เติมภายหลัง** (noted)
  - **⚠️ [P18 — ผู้ใช้เคาะ 2026-07-22] เปลี่ยนเป็น inline section:** PNG `1.Leave Calendar.png` มีจอ detail จริงเป็น **section inline ใต้ปฏิทิน** (หัวข้อ "วันที่ … (ลา N คน)" + การ์ดรายชื่อ) → implement เป็น `LeaveDayDetailSection` (inline) **ไม่ใช่ Drawer** ตาม PNG. ข้อความ Drawer ด้านบน/§10.3 เป็นของเดิม — อย่าแก้กลับเป็น Drawer
- API: `GET /leave/calendar?month=` (จุด) + `GET /leave/calendar/{date}` (รายละเอียด, กรองตาม role/PDPA)

### 6.2 Holidays — `2.Holidays.png`
- โครง: SegmentedTabs → **`NextHolidayHero`** (การ์ดน้ำเงิน: "วันหยุดถัดไป · อีก N วัน" + กล่องวันที่ใหญ่ 28 ก.ค. + ชื่อวันหยุดไทย/EN + tag ประเภท เช่น "วันสำคัญราชวงศ์") → หัว "รายการวันหยุด" + `DropdownFilter` ปี (S3) → รายการ `ListCard` (S6): กล่องวันที่ย่อ (สีตามประเภท) + ชื่อ + วันในสัปดาห์ + tag ประเภท + ›
- ประเภทวันหยุดมีสีต่างกัน (ราชการ=เขียว, ศาสนา=เหลือง, ราชวงศ์=ม่วง/ฟ้า) → token `--color-holiday-*`
- API: `GET /holidays?year=` — cache ยาว (ทั้งปีเปลี่ยนน้อย) + ชุดเดียวกับที่ `listLeaveWorkingDays` ใช้หักวันหยุด (เอกสารหลัก 4.1/3.5)
- นับถอยหลัง "อีก N วัน" คำนวณฝั่ง client ได้ (แสดงผลล้วน ไม่มีผลทางธุรกรรม)

### 6.3 Holiday Details — `3.Holiday Details.png`
- รายละเอียดวันหยุด: hero วันที่+ชื่อ + คำอธิบาย/ข้อมูล (`DetailField` S8) + ปิด
- API: ใช้ข้อมูลจาก list เดิมได้ (ไม่จำเป็นต้องมี endpoint แยก ถ้า payload holidays มี description มาแล้ว — เสนอให้รวมใน `GET /holidays`)

## Components: Shared S1 S3 S6 S8 S13 S14 S18 | Feature: `LeaveCalendar` (+custom DayButton/MonthCaption), `CalendarLegend`, `LeaveDayDetailSheet`, `NextHolidayHero`, `HolidayListItem` (ห่อ ListCard + กล่องวันที่สี)

## โครงไฟล์

```
features/calendar/
├── api/          # getLeaveCalendar(), getDayDetail(), getHolidays()
├── components/   # LeaveCalendar, CalendarLegend, LeaveDayDetailSheet,
│                 # NextHolidayHero, HolidayListItem
├── hooks/        # useLeaveCalendar(), useHolidays()
├── pages/        # CalendarShellPage (segmented สลับสองแท็บ)
└── index.ts
```

## หมายเหตุ
- `leave` feature ใช้ `useHolidays()` เพื่อคำนวณวันลา → export ผ่าน `index.ts` ของ calendar แล้ว compose ระดับ page/app ตามกฎเหล็ก (หรือย้าย hook วันหยุดไป shared ถ้าใช้หลายที่)
- จุดสีในปฏิทินใช้ token `--color-leave-*` ชุดเดียวกับ `LeaveTypeIcon` (00 §3) — สีต้องตรงกันทุกที่
