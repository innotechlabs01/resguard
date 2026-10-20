'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, Calendar, Bell, CreditCard, Car, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WelcomeCardProps {
  userName: string
  hasData: boolean
  onNavigate: (tab: string) => void
}

/**
 * First-login welcome card for the resident dashboard.
 * Shows when the user has no data yet (empty account).
 * Dismissible — persists dismissal in localStorage.
 */
export function WelcomeCard({ userName, hasData, onNavigate }: WelcomeCardProps) {
  const [dismissed, setDismissed] = useState(true) // default dismissed until we check

  useEffect(() => {
    // Only show if: not dismissed before AND no data
    const wasDismissed = localStorage.getItem('resguard-welcome-dismissed') === 'true'
    setDismissed(wasDismissed || hasData)
  }, [hasData])

  const handleDismiss = () => {
    localStorage.setItem('resguard-welcome-dismissed', 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  const actions = [
    {
      icon: Calendar,
      label: 'Reserva una zona común',
      description: 'Salón social, BBQ, gimnasio',
      tab: 'reservations',
    },
    {
      icon: Bell,
      label: 'Revisa tus avisos',
      description: 'Comunicados del edificio',
      tab: 'notifications',
    },
    {
      icon: Car,
      label: 'Solicita parqueadero',
      description: 'Para ti o tus visitas',
      tab: 'parking',
    },
    {
      icon: ShoppingBag,
      label: 'Explora el mercado vecinal',
      description: 'Productos y servicios de tus vecinos',
      tab: 'marketplace',
    },
  ]

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground"
          aria-label="Cerrar bienvenida"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          ¡Bienvenido, {userName}!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Tu cuenta está lista. Esto es lo que puedes hacer:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
