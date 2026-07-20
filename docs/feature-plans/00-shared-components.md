# 00 — Shared Components (ของที่ใช้ซ้ำข้ามหน้าจอ/ข้าม feature)

> วิเคราะห์จาก design SME-PAYROLL ทั้ง 37 หน้าจอ — component ในไฟล์นี้อยู่ที่ `src/components/` (shared)
> ตามกฎ: "รู้ business → อยู่ใน feature / UI ล้วน → shared" (เอกสารหลักหัวข้อ 5.3, 6)

## 1. ตาราง Shared Components + ใครใช้บ้าง

| # | Component | หน้าตาใน design | Reg | Att | Leave | Appr | Pay | Cal |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| S1 | `SegmentedTabs` | ปุ่มสลับ 2 ช่องมุมมนบนสุด (ขาว/น้ำเงิน + badge เลข) | | | ✔ การลาของฉัน\|รออนุมัติลา | ✔ เหมือน Leave เป๊ะ | | ✔ ปฏิทินการลา\|วันหยุด |
| S2 | `FilterChips` | ชิปกลม ทั้งหมด/ลาป่วย/ลาพักร้อน/ลากิจ | | | ✔ | | | |
| S3 | `DropdownFilter` | ปุ่ม ปี ▾ / เดือน ▾ / สถานะ ▾ | | ✔ History | ✔ | ✔ | ✔ ปี | ✔ ปี |
| S4 | `StatusBadge` | pill จุดสี+ข้อความ: รออนุมัติ(ส้ม) อนุมัติแล้ว(เขียว) ไม่อนุมัติ(แดง) ยกเลิก(เทา) | | | ✔ | ✔ **สีและ state ชุดเดียวกัน** | | |
| S5 | `LeaveTypeIcon` | ไอคอนสี่เหลี่ยมมน: พักร้อน(เขียว/เกาะ) ป่วย(ส้ม) กิจ(ฟ้า) | | | ✔ | ✔ | | ✔ legend |
| S6 | `ListCard` | การ์ดขาวมุมมน icon+หัวเรื่อง+บรรทัดรอง+badge+"ตรวจสอบ ›" | | ✔ History | ✔ ทุก list | ✔ ทุก list | ✔ รายเดือน | ✔ Holidays |
| S7 | `Toast` | pill ดำลอยล่าง icon เขียว/แดง + ข้อความ | | ✔ | ✔ ยกเลิกคำขอแล้ว | ✔ อนุมัติ/ไม่อนุมัติแล้ว | ✔ ส่งอีเมลแล้ว | |
| S8 | `DetailField` | แถว label ซ้ายเทา + value ขวาเข้ม + เส้นคั่น | | | ✔ details | ✔ details | ✔ payslip | ✔ holiday |
| S9 | `TypeBanner` | กล่องครีม หัวประเภทลา + "N วัน · เต็มวัน" ส้ม | | | ✔ | ✔ | | |
| S10 | `AttachmentItem` | แถวไฟล์ icon PDF + ชื่อ + ขนาด (+ x ตอน edit) | | | ✔ form+details | ✔ details | | |
| S11 | `PrimaryButton` | น้ำเงินมน (ลงทะเบียน/อนุมัติ/ส่งคำขอ) | ✔ | ✔ | ✔ | ✔ | | |
| S12 | `DangerSoftButton` | แดงอ่อนพื้นชมพู (ไม่อนุมัติ/ยกเลิกคำขอ) | | | ✔ | ✔ | | |
| S13 | `GhostButton` | ขาวขอบเทา (ปิด) | | | ✔ | ✔ | ✔ | |
| S14 | `BottomActionBar` | แถบปุ่ม 1-2 ปุ่มติดขอบล่าง (+safe-area) | | | ✔ | ✔ | ✔ | |
| S15 | `ProfileBar` | แถบ ชื่อ + อีเมล + kebab ⋮ ใต้ header | | ✔ | | | ✔ | |
| S16 | Form controls: `TextInput` `Textarea` `SelectField` `DateRangeField` `OTPInput` `ToggleFullHalfDay` | ช่องกรอกมุมมนพื้นขาว | ✔ | ✔ remote reason | ✔ ฟอร์มลา | ✔ ความเห็น | | |
| S17 | `SuccessScreen` | จอเขียว/เช็คถูก + ข้อความ + ปุ่ม | ✔ Complete | ✔ clock success | ✔ create success | | | |
| S18 | `ErrorState` / `EmptyState` | (จากเอกสารหลัก 20.4) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

## 2. คู่หน้าจอที่ "เหมือนกันจนควรเป็น component เดียว" (ประหยัดงานมากที่สุด)

| ของร่วม | ใช้ที่ | วิธีทำ |
|---|---|---|
| **`LeaveRequestDetailCard`** — layout รายละเอียดใบลา (หัวคน/ประเภท → TypeBanner → วันที่ลา, เหตุผล, วันลาคงเหลือ, เอกสารแนบ, ผู้ปฏิบัติงานแทน, ผู้อนุมัติ, ความเห็นผู้อนุมัติ) | Leave: History Details, Sended Pending Details / Approval: Pending Details, History Details ×2 — **5 หน้าจอ layout เดียวกันเป๊ะ** | component เดียว + prop `mode`: `owner-view` (ปุ่ม ปิด/ยกเลิกคำขอ), `approver-action` (comment กรอกได้ + ไม่อนุมัติ/อนุมัติ), `approver-view` (read-only + ปิด/ยกเลิกคำขอ) — วางไว้ `features/leave/components/` แล้ว approval compose ผ่านระดับ page ตามกฎเหล็กข้อ 1 หรือยกเป็น shared ถ้าทีมสะดวก |
| **`LeaveRequestCard`** — การ์ดใบลาใน list (LeaveTypeIcon + ชื่อ/ประเภท + วันที่ + StatusBadge + ตรวจสอบ ›) | Leave list ทุกแท็บ + Approval list ทุกแท็บ (ต่างแค่บรรทัดแรก: ฝั่งหัวหน้าโชว์ชื่อพนักงาน) | component เดียว prop `showEmployeeName` |
| **`ListFilterBar`** — แถว DropdownFilter (ปี/เดือน/สถานะ) ± FilterChips | Leave, Approval, Attendance History, Calendar, Payroll | ประกอบจาก S2+S3 |
| **จอแผนที่ Attendance** — Clock In/Out × onsite/remote ทั้ง 8 จอ คือ**จอเดียวกัน** ต่างแค่ state | Attendance 0-9 | หน้าเดียว `ClockPage` + state machine (ดู 02-attendance.md) |
| **Segmented + banner + tabs ของ Leave/Approval** | Leave กับ Approval ใช้ shell หน้าเดียวกัน (สลับด้วย SegmentedTabs บนสุด) | ทำเป็น `LeaveShellPage` ที่สลับเนื้อหาตาม segment — ลด routing ซ้ำ |

## 3. Design tokens ที่เห็นซ้ำทั้งชุด (ลง `@theme` — เอกสารหลัก 9.3)

| token | ค่าโดยประมาณจาก design | ใช้กับ |
|---|---|---|
| `--color-primary` | น้ำเงิน #1B6BB8~#0D6EBD | ปุ่มหลัก, segment active, hero payslip |
| `--color-primary-dark` | กรม #16335B | ตัวหนังสือหัวข้อ |
| `--color-success` | เขียว #24A148~#3DBE7B | badge อนุมัติ, pill ในรัศมี, toast icon |
| `--color-warning` | ส้ม/เหลือง #E8A33D | badge รออนุมัติ, TypeBanner text |
| `--color-danger` | แดง #D64545 | ไม่อนุมัติ, นอกรัศมี, ยกเลิก |
| `--color-leave-vacation / sick / personal` | เขียว / ส้มอิฐ / ฟ้าเทา | LeaveTypeIcon, จุดปฏิทิน, legend |
| `--color-surface` | ฟ้าอ่อนมาก #EAF3FB | พื้นหลังทุกหน้า |
| `--radius-card` | ~16-20px | การ์ด/ปุ่ม/ช่องกรอกทั้งหมด |
| ฟอนต์ | ตระกูล Prompt/Kanit | ทั้งแอป |

> ⚠️ ค่าสีเป็นการอ่านจากภาพ — ก่อนลง `@theme` ให้ดูดค่าจริงจากไฟล์ Figma (Design panel) ตามขั้นตอนเอกสารหลัก 9.5

## 4. ลำดับการสร้าง (แนะนำ)

1. Tokens ลง `@theme` → 2. S11-S14 (ปุ่ม+ActionBar) + S7 Toast + S18 → 3. S6 ListCard + S4 + S5 + S3 → 4. S16 form controls → 5. `LeaveRequestCard` + `LeaveRequestDetailCard` (ปลดล็อก 10+ หน้าจอของ Leave/Approval พร้อมกัน) → 6. ของเฉพาะ feature ตามไฟล์ 01-06
