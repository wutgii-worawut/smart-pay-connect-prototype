/**
 * MSW handler — feature: payroll (§16.3, feature-plans/05, P21) — `GET /payroll/payslips?year=` +
 * `GET /payroll/payslips/{id}` + `POST /payroll/payslips/{id}/email`
 *
 * 🔴 CONTRACT FLAGS (invented ทั้งชุด — §16.3 ระบุแค่ endpoint ไม่มี response shape ยืนยัน เหมือน
 * สถานการณ์ P13/P14/P15):
 * - ข้อมูลตัวอย่างอิงจาก design `5.Payroll/1.Payslip History.png` / `2.1...fullscreen.png` (ปี 2569
 *   = ค.ศ. 2026): มิ.ย. released netPay 28560 payDate 2026-06-30, พ.ค. released 28100 payDate
 *   2026-05-31, ก.ค. processing (สถานะ "ยังไม่ออก")
 * - `GET /payroll/payslips/:id` **ไม่กรองตาม `:id` จริง** (คืนตัวอย่างชุดเดียวตรง design เสมอ — เพียงพอ
 *   สำหรับทดสอบจอ detail ในเฟสนี้ เหมือน P15 `leave/requests/:id` ตอนเริ่ม)
 * - `POST /payroll/payslips/:id/email` ตอบ **204 body ว่าง** (ไม่ใช่ envelope `{data}`) — จงใจทดสอบ
 *   กับดัก P2 #5ข (ดูคอมเมนต์ `api/emailPayslip.ts`)
 *
 * scenario สลับได้ผ่าน `setPayslipsScenario()` / `setPayslipDetailScenario()` / `setEmailPayslipScenario()`
 */
import { http, HttpResponse } from 'msw'
import { BASE_URL } from '../base'

export type PayslipsScenario = 'data' | 'empty' | 'error'

let payslipsScenario: PayslipsScenario = 'data'

/** สลับ scenario ของ `GET /payroll/payslips` (ใช้ในเทสต์ หรือ dev console ตอน `npm run dev`) */
export function setPayslipsScenario(next: PayslipsScenario): void {
  payslipsScenario = next
}

export type PayslipDetailScenario = 'data' | 'error'

let payslipDetailScenario: PayslipDetailScenario = 'data'

/** สลับ scenario ของ `GET /payroll/payslips/{id}` */
export function setPayslipDetailScenario(next: PayslipDetailScenario): void {
  payslipDetailScenario = next
}

export type EmailPayslipScenario = 'success' | 'error'

let emailPayslipScenario: EmailPayslipScenario = 'success'

/** สลับ scenario ของ `POST /payroll/payslips/{id}/email` */
export function setEmailPayslipScenario(next: EmailPayslipScenario): void {
  emailPayslipScenario = next
}

/** reset scenario ทั้งหมดกลับ default — เรียกใน afterEach ของเทสต์กันรั่วข้ามเคส */
export function resetPayrollScenarios(): void {
  payslipsScenario = 'data'
  payslipDetailScenario = 'data'
  emailPayslipScenario = 'success'
}

/** ข้อมูลตัวอย่างอิงจาก `1.Payslip History.png` — เฉพาะปี 2026 (พ.ศ. 2569), ปีอื่นคืน [] */
const PAYSLIPS_2026 = [
  {
    id: 'payslip-2026-07',
    periodLabel: 'กรกฎาคม 2569',
    netPay: 0,
    payDate: '2026-07-31',
    status: 'processing' as const,
  },
  {
    id: 'payslip-2026-06',
    periodLabel: 'มิถุนายน 2569',
    netPay: 28560,
    payDate: '2026-06-30',
    status: 'released' as const,
  },
  {
    id: 'payslip-2026-05',
    periodLabel: 'พฤษภาคม 2569',
    netPay: 28100,
    payDate: '2026-05-31',
    status: 'released' as const,
  },
]

/** รายละเอียดตัวอย่างอิงจาก `2.1.Payslip Details (fullscreen).png` (รหัส 01009, งวดที่ 1 มิ.ย. 2569) */
const PAYSLIP_DETAIL = {
  id: 'payslip-2026-06',
  periodLabel: 'มิถุนายน 2569',
  netPay: 28560,
  payDate: '2026-06-30',
  periodRound: 'งวดที่ 1',
  employee: {
    code: '01009',
    name: 'กุหลาบ ประพฤติดี',
    position: 'ธุรการ',
    department: 'สำนักงานใหญ่',
    startDate: '01/01/2560',
  },
  earnings: [
    { label: 'เงินเดือนพื้นฐาน', amount: 25000 },
    { label: 'ค่าล่วงเวลาปกติ', amount: 2500 },
    { label: 'ค่าตำแหน่ง', amount: 1500 },
    { label: 'เบี้ยขยัน', amount: 1000 },
    { label: 'ลาแบบได้ค่าจ้าง', amount: 0 },
    { label: 'ทำงานวันหยุด', amount: 0 },
    { label: 'ล่วงเวลาวันหยุด', amount: 0 },
    { label: 'ค่ากะ', amount: 0 },
    { label: 'เงินค่าอาหาร', amount: 0 },
    { label: 'ค่าเช่าบ้าน', amount: 0 },
  ],
  deductions: [
    { label: 'ประกันสังคม', amount: -750 },
    { label: 'กองทุนสำรองเลี้ยงชีพ', amount: 0 },
    { label: 'กองทุนสงเคราะห์ลูกจ้าง', amount: 0 },
    { label: 'หักมาสาย', amount: 0 },
    { label: 'ภาษีหัก ณ ที่จ่าย', amount: -690 },
  ],
}

export const payrollHandlers = [
  http.get(`${BASE_URL}/payroll/payslips`, ({ request }) => {
    if (payslipsScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดสลิปเงินเดือนไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    if (payslipsScenario === 'empty') {
      return HttpResponse.json({ data: [] })
    }

    const url = new URL(request.url)
    const yearParam = url.searchParams.get('year')
    if (yearParam && Number(yearParam) !== 2026) {
      return HttpResponse.json({ data: [] })
    }

    return HttpResponse.json({ data: PAYSLIPS_2026 })
  }),

  http.get(`${BASE_URL}/payroll/payslips/:id`, () => {
    if (payslipDetailScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'โหลดรายละเอียดสลิปเงินเดือนไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    return HttpResponse.json({ data: PAYSLIP_DETAIL })
  }),

  http.post(`${BASE_URL}/payroll/payslips/:id/email`, () => {
    if (emailPayslipScenario === 'error') {
      return HttpResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 },
      )
    }
    // จงใจตอบ 204 body ว่าง (ไม่ใช่ envelope {data}) — ทดสอบกับดัก P2 #5ข ว่า emailPayslip()/interceptor
    // จัดการได้โดยไม่โยน error ดิบ
    return new HttpResponse(null, { status: 204 })
  }),
]
