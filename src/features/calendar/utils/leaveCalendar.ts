/**
 * features/calendar/utils/leaveCalendar.ts — pure function ประกอบ `LeaveCalendarDay[]` (response
 * ดิบของ `GET /leave/calendar?month=`) เป็น `LeaveMap` (Record<date, LeaveType[]>) ให้ `LeaveDayButton`
 * lookup ได้ O(1) ต่อวัน — ไม่มี React/network ในไฟล์นี้เลย testable ตรง ๆ ตาม testing.md (ภาคบังคับ)
 */
import type { LeaveCalendarDay, LeaveMap } from '../types/leaveCalendar'

/**
 * รวมรายการวันเป็น map — ถ้า response มีวันที่ซ้ำกัน (เช่น backend ส่งมาสองแถวของวันเดียวกันโดยไม่ตั้งใจ)
 * รวม types ของทั้งสองแถวเข้าด้วยกันแบบ dedupe (ไม่ throw, ไม่ทิ้งข้อมูล) — ลำดับ type ในผลลัพธ์ไม่รับประกัน
 * คงเดิม (ใช้ `Set` dedupe) เพราะ `LeaveDayButton` ไม่สนใจลำดับ จุดสีของแต่ละประเภทตายตัวอยู่แล้ว
 */
export function buildLeaveMap(days: LeaveCalendarDay[]): LeaveMap {
  return days.reduce<LeaveMap>((map, day) => {
    const existingTypes = map[day.date] ?? []
    const mergedTypes = Array.from(new Set([...existingTypes, ...day.types]))
    return { ...map, [day.date]: mergedTypes }
  }, {})
}
