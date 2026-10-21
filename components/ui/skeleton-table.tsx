'use client'

/**
 * Table row skeleton: mimics a table row with avatar, text lines, and badge.
 * Use inside <TableBody> while data is loading.
 */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="flex items-center gap-3">
            {i === 0 && (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            )}
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3.5 rounded bg-muted animate-pulse"
                style={{ width: `${60 + Math.sin(i * 3) * 20}%` }}
              />
              <div
                className="h-2.5 rounded bg-muted/60 animate-pulse"
                style={{ width: `${40 + Math.cos(i * 2) * 15}%` }}
              />
            </div>
          </div>
        </td>
      ))}
    </tr>
  )
}

/**
 * Full table skeleton: header + N rows.
 */
export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3 flex-1 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3 rounded bg-muted animate-pulse"
                style={{ width: `${50 + (i * 7) % 30}%` }}
              />
              <div
                className="h-2.5 rounded bg-muted/60 animate-pulse"
                style={{ width: `${30 + (i * 13) % 25}%` }}
              />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Stat card skeleton: mimics a small metric card.
 */
export function SkeletonStatCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      <div className="mt-3 h-8 w-16 rounded bg-muted animate-pulse" />
      <div className="mt-2 h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
    </div>
  )
}
