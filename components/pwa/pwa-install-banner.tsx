'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// UX spec §4 (2026-10-12-auth-recovery-landing-pwa-ux.md):
// - only on beforeinstallprompt
// - user has visited >=2 times OR >=60s in session
// - not already installed (display-mode: standalone)
// - dismiss persisted 30 days in localStorage; if installed, never again
// - iOS Safari never fires beforeinstallprompt -> banner simply never shows there
const DISMISS_KEY = 'pwa-banner-dismissed'
const VISITS_KEY = 'pwa-visit-count'
const DISMISS_DAYS = 30
const MIN_SESSION_MS = 60_000

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// localStorage/sessionStorage throw in private mode or when cookies are
// blocked. Banner is a nicety: degrade silently instead of letting the
// ErrorBoundary tear down the app.
function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch (error) {
    console.warn('[pwa] Storage unavailable, state not persisted:', error)
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

function isDismissed(): boolean {
  const raw = safeGet(localStorage, DISMISS_KEY)
  if (!raw) return false
  const ts = Number(raw)
  if (Number.isNaN(ts)) return false
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari standalone flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function bumpVisitCount(): number {
  // Count once per browser session.
  if (safeGet(sessionStorage, 'pwa-visit-counted')) {
    return Number(safeGet(localStorage, VISITS_KEY) || '0')
  }
  const next = Number(safeGet(localStorage, VISITS_KEY) || '0') + 1
  safeSet(localStorage, VISITS_KEY, String(next))
  safeSet(sessionStorage, 'pwa-visit-counted', '1')
  return next
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    const visits = bumpVisitCount()
    let promptEvent: BeforeInstallPromptEvent | null = null
    let timer: ReturnType<typeof setTimeout> | undefined

    const maybeShow = () => {
      if (promptEvent && !isDismissed() && !isStandalone()) {
        setDeferredPrompt(promptEvent)
        setVisible(true)
      }
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      promptEvent = event as BeforeInstallPromptEvent
      if (visits >= 2) {
        maybeShow()
      } else {
        timer = setTimeout(maybeShow, MIN_SESSION_MS)
      }
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      safeRemove(localStorage, DISMISS_KEY)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!visible || !deferredPrompt) return null

  const dismiss = () => {
    safeSet(localStorage, DISMISS_KEY, String(Date.now()))
    setVisible(false)
    setDeferredPrompt(null)
  }

  const install = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome !== 'accepted') {
      // Treat rejection inside the prompt like "Ahora no" but without the 30d
      // block — the browser already throttles re-prompting.
      setVisible(false)
      setDeferredPrompt(null)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') dismiss()
  }

  return (
    <Card
      role="dialog"
      aria-label="Instala ResGuard"
      onKeyDown={onKeyDown}
      className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-3 p-4 shadow-lg sm:left-auto sm:max-w-sm"
    >
      <div>
        <p className="font-semibold text-foreground">Instala ResGuard</p>
        <p className="text-sm text-muted-foreground">
          Accede más rápido y recibe notificaciones de tu edificio.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Ahora no
        </Button>
        <Button size="sm" onClick={install} autoFocus={false}>
          Instalar
        </Button>
      </div>
    </Card>
  )
}
