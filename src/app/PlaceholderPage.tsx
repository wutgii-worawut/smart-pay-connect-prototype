/**
 * app/PlaceholderPage.tsx — placeholder ของทุก route ใน P3 (ยังไม่มี UI feature จริง)
 * ตั้ง document.title ตาม route ให้ตรง design ไว้ก่อน แม้เนื้อหายังไม่ทำ
 */
import { usePageTitle } from '@/hooks/usePageTitle'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  usePageTitle(title)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface p-6 text-center">
      <p className="text-lg font-semibold text-primary-dark">{title}</p>
      <p className="text-sm text-text-secondary">หน้านี้อยู่ระหว่างการพัฒนา</p>
    </div>
  )
}
