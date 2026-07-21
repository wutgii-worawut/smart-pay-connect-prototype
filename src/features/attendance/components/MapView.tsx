/**
 * features/attendance/components/MapView.tsx — แผนที่ลงเวลา (§15, feature-plans/02, §23.2#3)
 *
 * ⚠️ Map provider ยังไม่เคาะ (open question §23.2#3) — ห้ามผูก Google Maps key. เริ่มด้วย
 * MapLibre GL + raster tile ฟรีของ OpenStreetMap (ไม่ต้องใช้ API key) — คอมโพเนนต์นี้เป็น
 * **interface กลาง** (props: userPos/officePos/radiusMeters) เพื่อสลับ provider ได้ทีหลังโดย
 * ไม่กระทบ caller (ClockPage ที่จะทำใน P12)
 *
 * กติกาคุมโควตา map loads (§15 "กติกาการใช้แผนที่"):
 * - สร้าง map instance **ครั้งเดียว** ต่อการเปิดหน้า (useEffect mount เดียว, guard ด้วย retryKey)
 * - เปลี่ยน `userPos` (เช่นกด "โหลดแผนที่ใหม่" ที่ P12 ขอ GPS ใหม่) → อัปเดตหมุด + `panTo()` บน
 *   instance เดิมเท่านั้น **ห้าม re-init แผนที่**
 * - `retryKey` re-init เฉพาะกรณี init/โหลดสไตล์ล้มเหลวจริง (เน็ตวูบตอนเปิดหน้า) ผ่านปุ่ม "ลองใหม่"
 *   ในสถานะ error เท่านั้น — คนละกรณีกับปุ่ม "โหลดแผนที่ใหม่" ใน design ที่ไม่ได้อยู่ในคอมโพเนนต์นี้
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import gpsPinIcon from '@/assets/gps/gps-pin.png'
import gpsOfficeIcon from '@/assets/gps/gps-checked-location.png'
import { ErrorState } from '@/components/ErrorState'
import { Spinner } from '@/components/Spinner'
import type { LatLng } from '../utils/haversine'

export interface MapViewProps {
  /** พิกัดผู้ใช้ปัจจุบัน — `null` = ยังไม่ได้ขอ GPS หรือขอไม่สำเร็จ (ไม่แสดงหมุดผู้ใช้) */
  userPos: LatLng | null
  /** พิกัดสถานที่ทำงาน (จาก `GET /attendance/today`) */
  officePos: LatLng
  /** รัศมี geofence เป็นเมตร — วาดวงกลม preview รอบออฟฟิศเท่านั้น (ตัดสินจริงที่ server) */
  radiusMeters: number
  className?: string
}

type MapStatus = 'loading' | 'ready' | 'error'

const OFFICE_RADIUS_SOURCE_ID = 'attendance-office-radius-source'
const OFFICE_RADIUS_LAYER_ID = 'attendance-office-radius-layer'

/** เวลาที่ยอมรอ 'load' ก่อนถือว่าโหลดไม่สำเร็จ (เน็ตวูบ) — กันจอค้าง spinner ตลอดไป */
const MAP_LOAD_TIMEOUT_MS = 15000

/**
 * tile แผนที่ฟรีของ OpenStreetMap — ไม่ต้องใช้ API key (ตรงข้อห้าม §23.2#3 ห้ามผูก Google key)
 * หมายเหตุ: นโยบายการใช้งาน tile server มาตรฐานของ OSM ไม่เหมาะกับ production โหลดสูง —
 * ก่อนขึ้น production จริงควรพิจารณาสลับเป็น tile proxy ของทีมเองหรือผู้ให้บริการที่มี SLA
 * (ยังไม่เคาะ provider สุดท้าย — ดู open question §23.2#3)
 */
const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-tiles-layer',
      type: 'raster',
      source: 'osm-raster-tiles',
    },
  ],
}

/** อ่านค่าสีจาก CSS custom property ของ `@theme` (globals.css) — คงสี token เดียวกับที่อื่นในแอป */
function readThemeColor(cssVariableName: string, fallbackHex: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVariableName).trim()
  return value || fallbackHex
}

/**
 * แปลงรัศมีหน่วยเมตร → pixel ที่ zoom 20 (สูตรมาตรฐานของ MapLibre/Mapbox สำหรับวาดวงกลมหน่วยเมตร
 * ให้สเกลตามละติจูดถูกต้อง — ใช้คู่กับ paint expression แบบ exponential ฐาน 2 ตาม zoom)
 */
function metersToPixelsAtMaxZoom(meters: number, latitude: number): number {
  return meters / 0.075 / Math.cos((latitude * Math.PI) / 180)
}

function createMarkerElement(iconUrl: string, altText: string): HTMLElement {
  const img = document.createElement('img')
  img.src = iconUrl
  img.alt = altText
  img.draggable = false
  img.className = 'h-10 w-10 select-none'
  return img
}

export function MapView({ userPos, officePos, radiusMeters, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const officeMarkerRef = useRef<Marker | null>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  const [retryKey, setRetryKey] = useState(0)

  // สร้าง map instance ครั้งเดียวต่อการเปิดหน้า (หรือกด "ลองใหม่" หลัง error) — officePos/radiusMeters
  // ที่ effect นี้อ่านคือค่าตอน mount/retry เท่านั้น การเปลี่ยนภายหลังไม่ทำให้ re-init (กันเผาโควตา §15)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setStatus('loading')

    const map = new MapLibreMap({
      container,
      style: OSM_RASTER_STYLE,
      center: [officePos.lng, officePos.lat],
      zoom: 16,
      attributionControl: { compact: true },
    })
    mapRef.current = map

    let settled = false

    const loadTimeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true
        setStatus('error')
      }
    }, MAP_LOAD_TIMEOUT_MS)

    const handleLoad = () => {
      if (settled) return
      settled = true
      window.clearTimeout(loadTimeoutId)

      map.addSource(OFFICE_RADIUS_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [officePos.lng, officePos.lat] },
        },
      })
      map.addLayer({
        id: OFFICE_RADIUS_LAYER_ID,
        type: 'circle',
        source: OFFICE_RADIUS_SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            0,
            0,
            20,
            metersToPixelsAtMaxZoom(radiusMeters, officePos.lat),
          ],
          'circle-color': readThemeColor('--color-primary', '#1b6bb8'),
          'circle-opacity': 0.15,
          'circle-stroke-width': 1,
          'circle-stroke-color': readThemeColor('--color-primary', '#1b6bb8'),
          'circle-stroke-opacity': 0.4,
        },
      })

      officeMarkerRef.current = new Marker({
        element: createMarkerElement(gpsOfficeIcon, 'ตำแหน่งสถานที่ทำงาน'),
        anchor: 'bottom',
      })
        .setLngLat([officePos.lng, officePos.lat])
        .addTo(map)

      setStatus('ready')
    }

    const handleError = () => {
      if (settled) return
      settled = true
      window.clearTimeout(loadTimeoutId)
      setStatus('error')
    }

    map.on('load', handleLoad)
    map.on('error', handleError)

    return () => {
      window.clearTimeout(loadTimeoutId)
      map.off('load', handleLoad)
      map.off('error', handleError)
      userMarkerRef.current?.remove()
      officeMarkerRef.current?.remove()
      userMarkerRef.current = null
      officeMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // officePos/radiusMeters อ่านค่า ณ ตอน mount/retry เท่านั้น — เปลี่ยนทีหลังไม่ re-init ตามกติกา §15
    // (ตำแหน่งผู้ใช้ sync ผ่าน effect แยกด้านล่างด้วย panTo บน instance เดิม)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ตั้งใจ init ครั้งเดียวต่อ retryKey เท่านั้น
  }, [retryKey])

  // sync หมุดผู้ใช้ + panTo บน instance เดิมเมื่อ userPos เปลี่ยน (เช่นขอ GPS ใหม่) — ไม่ re-init แผนที่
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return

    if (!userPos) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userPos.lng, userPos.lat])
    } else {
      userMarkerRef.current = new Marker({
        element: createMarkerElement(gpsPinIcon, 'ตำแหน่งของคุณ'),
        anchor: 'bottom',
      })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map)
    }

    map.panTo([userPos.lng, userPos.lat])
  }, [userPos, status])

  const handleRetry = useCallback(() => {
    setRetryKey((key) => key + 1)
  }, [])

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-card ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' ? (
        <div className="bg-surface absolute inset-0 flex items-center justify-center">
          <Spinner className="border-primary h-8 w-8" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="bg-surface absolute inset-0 flex items-center justify-center">
          <ErrorState message="โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่" onRetry={handleRetry} />
        </div>
      ) : null}
    </div>
  )
}
