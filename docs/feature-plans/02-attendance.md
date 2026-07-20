# 02 — Attendance (ลงเวลา) — 11 หน้าจอ = จริง ๆ คือ 2 หน้า + state machine

> โฟลเดอร์: `features/attendance/` | อ้างอิงเอกสารหลัก: 15 (GPS), 3.1 (remote + นโยบาย), 16.3 (API)
> Rich Menu → `/attendance`

## ข้อค้นพบสำคัญ: หน้าจอ 0-9 (10 จอ) คือ "หน้าเดียวกัน" ต่าง state

จอแผนที่ทั้งหมดใช้โครงเดียวกัน: `ProfileBar` (S15) → แผนที่ (หมุดผู้ใช้สีน้ำเงิน + วงรัศมี + หมุดออฟฟิศสีแดง) + pill สถานะมุมขวาบน → dock ล่าง (ประวัติลงเวลา | ปุ่มวงกลมใหญ่ **ลงเวลา** | โหลดแผนที่ใหม่)

### State machine ของ `ClockPage` (route `/attendance`)

| state | เงื่อนไข | pill บนแผนที่ | ปุ่มลงเวลา | จาก design |
|---|---|---|---|---|
| `in-range-ready` | ยังไม่เข้า + อยู่ในรัศมี | เขียว "อยู่ในรัศมี" | น้ำเงิน กดได้ → clock-in onsite | จอ 1 |
| `out-of-range` | ยังไม่เข้า + นอกรัศมี | แดง "อยู่นอกรัศมี" | **เทา disabled** + โชว์ pill เขียว "ไปทำงานนอกสถานที่" เป็นทางเลือก | จอ 0 |
| `remote-ready` | ผู้ใช้เลือกโหมดนอกสถานที่ | แดงนอกรัศมี + pill เขียว active | น้ำเงิน กดได้ → เปิดกรอกเหตุผล → clock-in remote | จอ 6 |
| `clocked-in` | เข้าแล้ว ยังไม่ออก | — | ปุ่มโหมด clock-out | จอ 3 (onsite) / 8 (remote) |
| `completed` | เข้า-ออกครบวันแล้ว | — | ปุ่ม disabled/สรุปเวลา | จอ 5 |
| `success` (ชั่วคราว) | หลังลงเวลาสำเร็จ | overlay/success + `Toast` (S7) เวลาที่บันทึก | | จอ 2, 4, 7, 9 |

→ เขียนเป็น state เดียว `useAttendanceState()` ที่ derive จาก `GET /attendance/today` + ผล geofence check ฝั่ง client (UX เท่านั้น — server ตัดสินจริง)

## หน้าจอที่ 2: History — `10.History.png`
- Route: `/attendance/history` (เข้าจากปุ่มในดอค)
- โครง: `DropdownFilter` ปี/เดือน (S3) → รายการต่อวันด้วย `ListCard` (S6): วันที่, เวลาเข้า-ออก, ประเภท (onsite/remote), สถานะ (ปกติ/มาสาย)
- API: `GET /attendance/history?month=`

## Components

| ที่ | รายการ |
|---|---|
| Shared | S3, S6, S7, S15, S16 (Textarea เหตุผล remote), S18 |
| Feature | `MapView` (แผนที่+หมุด+วงรัศมี), `RangeStatusPill`, `RemoteModePill`, `ClockButton` (วงกลมใหญ่ 3 สถานะ: enabled/disabled/clock-out), `ClockDock` (แถบล่าง 3 ปุ่ม), `ClockSuccessOverlay`, `RemoteReasonSheet` (Drawer กรอกเหตุผล — checklist 10.2) |

## เทคนิค/ข้อควรระวัง
- **แผนที่**: ต้องเลือก map library — design หน้าตาเป็น Google Maps → ใช้ Google Maps JS SDK (มีค่าใช้จ่าย/API key) หรือ MapLibre+OSM (ฟรี) → **คำถามใหม่: องค์กรมี Google Maps API key ไหม?** (เพิ่มเข้า Open Questions 23)
- ปุ่ม "โหลดแผนที่ใหม่" = ขอ GPS ใหม่ (`getPositionWithRetry` เอกสารหลัก 15) — เรียกจาก user action ตามกฎ LIFF
- GPS ต้องส่ง `accuracy` ไปกับ clock-in ทุกครั้ง (audit)
- Error mapping: `OUT_OF_GEOFENCE` (ยิงตรง) → สลับ state `out-of-range`, `ALREADY_CLOCKED_IN` → refresh today
- Remote clock: นโยบายใครใช้ได้ ยังรอเคาะ (Open Questions 23.1 ข้อ 4) — โค้ดเผื่อ flag `canRemoteClock` ต่อพนักงานไว้

## API ที่ใช้ (จาก contract 16.3)
`GET /attendance/today` · `POST /attendance/clock-in` · `POST /attendance/clock-out` · `GET /attendance/history?month=`

## โครงไฟล์ feature

```
features/attendance/
├── api/          # getToday(), clockIn(), clockOut(), getHistory()
├── components/   # MapView, ClockButton, ClockDock, RangeStatusPill,
│                 # RemoteModePill, RemoteReasonSheet, ClockSuccessOverlay,
│                 # AttendanceHistoryList
├── hooks/        # useAttendanceState(), useGeolocation() (จากเอกสารหลัก 15)
├── utils/        # haversine preview (UX เท่านั้น)
├── pages/        # ClockPage, AttendanceHistoryPage
└── index.ts
```
