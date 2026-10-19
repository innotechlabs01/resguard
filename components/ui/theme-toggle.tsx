'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type ThemeOption = 'light' | 'system' | 'dark'

const OPTIONS: { value: ThemeOption; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Modo claro', Icon: Sun },
  { value: 'system', label: 'Preferencia del sistema', Icon: Monitor },
  { value: 'dark', label: 'Modo oscuro', Icon: Moon },
]

/**
 * Accessible light/system/dark theme switch.
 * Renders active state only after mount to avoid hydration mismatch with the
 * server (next-themes resolves the stored/system theme on the client).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la interfaz"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              active
                ? 'bg-card text-foreground shadow-elev1'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
