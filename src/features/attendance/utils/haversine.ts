/**
 * features/attendance/utils/haversine.ts — ระยะทางวงกลมใหญ่ (great-circle distance) ระหว่าง 2 พิกัด (§15)
 *
 * อยู่ใน feature นี้ (ไม่ shared) เพราะ `isWithinRadius(user, office, radiusMeters)` ผูก business
 * "รัศมี geofence ของสถานที่ทำงาน" ตรง ๆ และยังไม่มี feature อื่นต้องใช้ (§6, §7.3) — ห้าม export
 * ออก `features/attendance/index.ts`
 *
 * ⚠️ ใช้เป็น **preview ฝั่ง client เท่านั้น** (เช่น แสดง pill "อยู่ในรัศมี (โดยประมาณ)" ก่อนกดลงเวลา) —
 * ผลตรวจ geofence จริงที่ตัดสินว่าลงเวลาได้หรือไม่ **คำนวณที่ server เสมอ** (§15 "กติกาฝั่ง backend")
 * ห้ามใช้ผลจากไฟล์นี้ปิด/เปิดปุ่มลงเวลาแบบเด็ดขาด — ใช้เป็นตัวช่วย UX เท่านั้น
 */

export interface LatLng {
  lat: number
  lng: number
}

/** รัศมีโลกเฉลี่ย (เมตร) — ใช้ค่าทรงกลมมาตรฐานเดียวกับสูตร haversine ทั่วไป */
const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** ระยะทางเป็นเมตรระหว่าง 2 พิกัด (great-circle, สูตร haversine) — pure, ไม่มี side effect */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinDeltaLat = Math.sin(deltaLat / 2)
  const sinDeltaLng = Math.sin(deltaLng / 2)

  const h = sinDeltaLat * sinDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinDeltaLng * sinDeltaLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

  return EARTH_RADIUS_METERS * c
}

/**
 * เช็คคร่าว ๆ ว่าพิกัดผู้ใช้อยู่ในรัศมีของออฟฟิศไหม (preview เท่านั้น — ดูคำเตือนด้านบนไฟล์)
 * ใช้แสดงผล UX ก่อนกดปุ่ม เช่น pill "อยู่ในรัศมี (โดยประมาณ)" — ไม่ใช่ตัวตัดสินอนุญาตลงเวลา
 */
export function isWithinRadius(user: LatLng, office: LatLng, radiusMeters: number): boolean {
  return haversineMeters(user, office) <= radiusMeters
}
