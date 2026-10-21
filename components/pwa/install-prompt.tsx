'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWA Install Prompt: shows a dismissible banner when the app is installable.
 * On Android/Chrome uses the beforeinstallprompt event.
 * On iOS/Safari shows specific instructions (Safari doesn't support beforeinstallprompt).
 * Persists dismissal for 7 days.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem('resguard-install-dismissed')
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return
    }

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari doesn't fire beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS && !deferredPrompt) {
      // Small delay to not interrupt initial load
      const timer = setTimeout(() => {
        setShowIOSHint(true)
        setVisible(true)
      }, 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [deferredPrompt])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice()
      if (choice.outcome === 'accepted') {
        setVisible(false)
      }
      setDeferredPrompt(null)
    } else if (showIOSHint) {
      // On iOS, just close — the instructions are shown in the banner
      handleDismiss()
    }
  }, [deferredPrompt, showIOSHint])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem('resguard-install-dismissed', String(Date.now()))
  }, [])

  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Instalar aplicación"
      className="fixed bottom-16 left-4 right-4 z-[60] md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Instala ResGuard
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showIOSHint ? (
                <>
                  En Safari: toca{' '}
                  <Share className="inline h-3.5 w-3.5" aria-label="Compartir" />{' '}
                  → <SquarePlus className="inline h-3.5 w-3.5" aria-label="Añadir" />{' '}
                  «Añadir a pantalla de inicio»
                </>
              ) : (
                'Accede más rápido, funciona como app nativa, recibe notificaciones.'
              )}
            </p>

            {!showIOSHint && (
              <Button
                onClick={handleInstall}
                size="sm"
                className="mt-2 w-full gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar ahora
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
