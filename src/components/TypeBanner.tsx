/**
 * components/TypeBanner.tsx — แถบครีมหัวประเภทลา + สรุป "N วัน · เต็มวัน" ส้ม (S9, feature-plans/00 §1)
 * ใช้ในหัวการ์ด detail ฝั่ง approver (Leave/Approval — feature-plans/00 §1 S9)
 */
interface TypeBannerProps {
  /** ชื่อประเภทลา เช่น "ลาพักร้อน" */
  typeLabel: string
  /** สรุปจำนวนวัน เช่น "1 วัน · เต็มวัน" */
  summary: string
  className?: string
}

export function TypeBanner({ typeLabel, summary, className }: TypeBannerProps) {
  return (
    <div
      className={['rounded-card bg-warning/10 px-5 py-4', className].filter(Boolean).join(' ')}
    >
      <p className="text-lg font-semibold text-primary-dark">{typeLabel}</p>
      <p className="mt-1 text-sm font-semibold text-warning">{summary}</p>
    </div>
  )
}
