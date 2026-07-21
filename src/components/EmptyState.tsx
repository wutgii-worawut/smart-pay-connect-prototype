/**
 * components/EmptyState.tsx — ไม่มีข้อมูลในรายการ (S18, feature-plans/00 §1)
 */
interface EmptyStateProps {
  message: string
  description?: string
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 text-text-secondary"
        aria-hidden="true"
      >
        <path d="M3 7l2-4h14l2 4" />
        <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
        <path d="M8 11a4 4 0 0 0 8 0" />
      </svg>
      <p className="text-sm font-medium text-primary-dark">{message}</p>
      {description ? <p className="text-xs text-text-secondary">{description}</p> : null}
    </div>
  )
}
