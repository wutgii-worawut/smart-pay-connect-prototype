/**
 * features/payroll/pages/PayslipListPage.tsx — route `/payroll` (จอ `1.Payslip History.png`,
 * feature-plans/05 §5.1, P21)
 *
 * โครง: DropdownFilter ปี → แยกข้อมูลจาก `usePayslips(year)` เป็น 3 กลุ่ม (ไม่ hardcode ลำดับจาก API):
 * - **latest released** (payDate ล่าสุดในบรรดา status==='released') → `PayslipLatestHero`
 * - **processing** (status==='processing') → `PayslipProcessingCard` ต่อรายการ
 * - **released history** (ทุก released เรียงใหม่→เก่า รวมรายการเดียวกับ hero — ตรง design ที่
 *   `1.Payslip History.png` โชว์ "มิถุนายน 2569" ซ้ำทั้งใน hero และประวัติ) → `PayslipCard` list
 *
 * ⚠️ deviation จาก feature-plans/05 §5.1 (บรรยายแค่ "ListCard ต่อเดือน") — PNG จริงมี hero
 * การ์ดสลิปล่าสุด + การ์ด "กำลังประมวลผล" เพิ่มมาด้วย ยึด design ตาม CLAUDE.md
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DropdownFilter } from '@/components/DropdownFilter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ApiError } from '@/lib/api-client'
import { PayslipCard } from '../components/PayslipCard'
import { PayslipLatestHero } from '../components/PayslipLatestHero'
import { PayslipProcessingCard } from '../components/PayslipProcessingCard'
import { usePayslips } from '../hooks/usePayslips'
import { generatePayslipYearOptions } from '../utils/yearOptions'
import type { Payslip } from '../types/payslip'

export function PayslipListPage() {
  usePageTitle('ดูสลิปเงินเดือน')
  const navigate = useNavigate()

  const [year, setYear] = useState(() => new Date().getFullYear())
  // ตัวเลือกปี lazy init ครั้งเดียวตอน mount (มิเรอร์ P14 LeaveShellPage กัน re-render ตัวเลือกขยับ)
  const [yearOptions] = useState(() => generatePayslipYearOptions(new Date().getFullYear()))

  const { data: payslips, isLoading, isError, error, refetch } = usePayslips(year)

  function goToDetail(id: string) {
    navigate(`/payroll/${id}`)
  }

  const released = (payslips ?? []).filter((p): p is Payslip => p.status === 'released')
  const processing = (payslips ?? []).filter((p) => p.status === 'processing')
  // เรียงใหม่→เก่าด้วย payDate ('YYYY-MM-DD' เทียบ string ตรงลำดับได้เลย) — จัดลำดับการแสดงผลล้วน
  // ไม่ใช่การคำนวณเงิน/โควตา
  const releasedSorted = [...released].sort((a, b) => (a.payDate < b.payDate ? 1 : -1))
  const latest = releasedSorted[0]

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-8">
      <h1 className="mb-4 text-lg font-semibold text-primary-dark">สลิปเงินเดือน</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 border-primary" />
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'โหลดสลิปเงินเดือนไม่สำเร็จ'}
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="space-y-4">
          {latest ? <PayslipLatestHero payslip={latest} onView={() => goToDetail(latest.id)} /> : null}

          {processing.map((p) => (
            <PayslipProcessingCard key={p.id} payslip={p} />
          ))}

          <div className="pt-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-dark">ประวัติสลิปเงินเดือน</h2>
              <DropdownFilter
                options={yearOptions}
                value={String(year)}
                onChange={(value) => setYear(Number(value))}
                ariaLabel="กรองปี"
              />
            </div>

            {releasedSorted.length === 0 ? (
              <EmptyState message="ยังไม่มีสลิปเงินเดือนในปีนี้" />
            ) : (
              <div className="space-y-3">
                {releasedSorted.map((p) => (
                  <PayslipCard key={p.id} payslip={p} onClick={() => goToDetail(p.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
