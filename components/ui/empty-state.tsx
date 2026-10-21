'use client'

import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

/**
 * Reusable empty state with icon, description, and optional CTA.
 * Provides clear guidance on what to do (or what will appear here).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'} px-4`}
      role="status"
    >
      <div className="rounded-2xl bg-muted/50 border border-border p-4 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
      </div>

      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
