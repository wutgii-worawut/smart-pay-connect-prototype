/**
 * hooks/usePageTitle.ts — ตั้งชื่อหน้าที่โผล่ในแถบ LIFF header ของ LINE (feature-plans/00 §0)
 *
 * LINE วาด header เอง ('‹  SmartPay Connect : ลงเวลาทำงาน  ✕') — ส่วนเดียวที่เราคุมได้คือ
 * document.title ทุก page เรียก usePageTitle('ลงเวลาทำงาน') โดยไม่ต้องใส่ชื่อแอปเอง
 */
import { useEffect } from 'react'

const APP_NAME = 'SmartPay Connect'

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${APP_NAME} : ${title}`
  }, [title])
}
