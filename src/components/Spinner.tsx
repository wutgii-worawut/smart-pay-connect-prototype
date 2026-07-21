/**
 * components/Spinner.tsx — ตัวหมุนโหลดขนาดเล็ก แทนไอคอนในปุ่มระหว่าง isPending (S11-S13)
 * ใช้ภายใน PrimaryButton/DangerSoftButton/GhostButton เท่านั้น — ไม่อยู่ในตาราง S แต่ช่วยลด class ซ้ำ
 */
interface SpinnerProps {
  className?: string
}

export function Spinner({ className = 'h-5 w-5 border-white' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="กำลังดำเนินการ"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-t-transparent ${className}`}
    />
  )
}
