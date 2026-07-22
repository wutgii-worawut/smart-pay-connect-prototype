/**
 * features/approval/components/ApprovalTabs.tsx — แท็บในของ `ApprovalListPage` (P19, จอ
 * `1.Pending List.png`/`4.History.png`): "รออนุมัติ (n) | ประวัติการอนุมัติ" ทรง underline
 * (ต่างจาก `SegmentedTabs` shared ที่มีแค่ทรง pill/card — เขียนเองตามคอมเมนต์ task brief)
 * controlled ล้วน (value+onChange) — presentational ไม่มี business logic
 */
interface ApprovalTabsProps {
  value: 'pending' | 'history'
  onChange: (value: 'pending' | 'history') => void
  /** จำนวนใบรออนุมัติ — แสดงเป็น badge วงกลมข้างคำว่า "รออนุมัติ" เสมอ (แม้ 0) */
  pendingCount: number
}

export function ApprovalTabs({ value, onChange, pendingCount }: ApprovalTabsProps) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-primary/10">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'pending'}
        onClick={() => onChange('pending')}
        className={[
          'flex items-center gap-2 border-b-2 pb-3 text-base font-semibold transition-colors',
          value === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-secondary',
        ].join(' ')}
      >
        <span>รออนุมัติ</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
          {pendingCount}
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'history'}
        onClick={() => onChange('history')}
        className={[
          'border-b-2 pb-3 text-base font-semibold transition-colors',
          value === 'history' ? 'border-primary text-primary' : 'border-transparent text-text-secondary',
        ].join(' ')}
      >
        ประวัติการอนุมัติ
      </button>
    </div>
  )
}
