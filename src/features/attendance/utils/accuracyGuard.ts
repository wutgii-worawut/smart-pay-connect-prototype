/**
 * features/attendance/utils/accuracyGuard.ts — เกณฑ์เตือน GPS accuracy แย่ (§15 "UX เมื่อสัญญาณ GPS
 * แย่") — pure function ล้วน (ไม่มี side effect), ClockPage เป็นคนยิง toast เอง
 *
 * เกณฑ์ตาม architecture.md §15: "accuracy แย่เกินเกณฑ์ — แนะนำเกณฑ์ = มากกว่ารัศมี geofence ของสาขา
 * หรือ > 100 ม." — ใช้ค่าที่มากกว่าระหว่างสองเกณฑ์ (สาขารัศมีเล็กกว่า 100 ม. ก็ยังเตือนที่ 100 ม.
 * เป็นพื้น กันเตือนถี่เกินไปกับสาขารัศมีแคบ)
 *
 * เป็น UX warning เท่านั้น — ไม่ใช่ตัวตัดสินอนุญาต/ปฏิเสธลงเวลา (server ตัดสิน geofence จริงเสมอ)
 */

/** เกณฑ์ต่ำสุดที่ใช้เตือน (เมตร) แม้สาขาจะมีรัศมี geofence แคบกว่านี้ */
const MIN_ACCURACY_WARNING_THRESHOLD_METERS = 100

/** ตัดสินว่า accuracy (เมตร) ที่ได้จาก GPS แย่เกินเกณฑ์ควรเตือนผู้ใช้ก่อนลงเวลาหรือไม่ */
export function isAccuracyDegraded(accuracy: number, radiusMeters: number): boolean {
  const threshold = Math.max(radiusMeters, MIN_ACCURACY_WARNING_THRESHOLD_METERS)
  return accuracy > threshold
}
