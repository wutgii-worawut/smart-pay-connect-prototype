/**
 * components/SegmentedTabs.tsx — แท็บสลับ 2 ช่องมุมมนขาว/น้ำเงิน + badge เลข (S1, feature-plans/00 §1)
 * controlled ล้วน (value+onChange) — ใช้ทั้งบนสุด (Calendar: ปฏิทินการลา|วันหยุด) และล่างสุด
 * (Leave/Approval: ประวัติการลาของฉัน|ใบลารออนุมัติ) แล้วแต่ตำแหน่งที่ page ครอบไว้ ไม่ผูก layout เอง
 *
 * design มี 2 ทรง: 'pill' (มุมโค้งเต็ม — แท็บล่างสุด Leave/Approval) กับ 'card' (มุมโค้ง
 * --radius-card — แท็บบนสุด Calendar) — ควบคุมผ่าน prop `shape` เท่านั้น ห้าม override ผ่าน className
 */
interface SegmentedTab {
  value: string
  label: string
  /** จำนวน badge เช่นจำนวนรออนุมัติ — ไม่แสดงถ้า undefined หรือ 0 */
  badge?: number
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[]
  value: string
  onChange: (value: string) => void
  /** ทรงของแท็บ — 'pill' (ค่าเริ่มต้น) มุมโค้งเต็ม / 'card' มุมโค้ง --radius-card */
  shape?: 'card' | 'pill'
  className?: string
}

function shapeClass(shape: 'card' | 'pill'): string {
  return shape === 'pill' ? 'rounded-full' : 'rounded-card'
}

export function SegmentedTabs({
  tabs,
  value,
  onChange,
  shape = 'pill',
  className,
}: SegmentedTabsProps) {
  return (
    <div role="tablist" className={['flex gap-3', className].filter(Boolean).join(' ')}>
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={[
              'inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors',
              shapeClass(shape),
              active
                ? 'bg-primary text-white'
                : 'border border-primary/15 bg-white text-text-secondary',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs font-semibold text-white">
                {tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
