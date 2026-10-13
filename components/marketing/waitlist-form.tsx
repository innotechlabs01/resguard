'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

type FormState = 'idle' | 'loading' | 'success' | 'error'

const SUCCESS_MESSAGE =
  '¡Listo! Registramos tu correo y te contactaremos cuando abramos nuevos edificios.'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing' }),
      })
      setState(res.ok ? 'success' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <p className="text-foreground text-base" role="status">
        {SUCCESS_MESSAGE}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="waitlist-email" className="sr-only">
            Correo electrónico
          </Label>
          <Input
            id="waitlist-email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={state === 'loading'}>
          {state === 'loading' ? (
            <>
              <Spinner className="size-4" /> Enviando…
            </>
          ) : (
            'Únete a la lista'
          )}
        </Button>
      </div>
      {state === 'error' && (
        <p className="text-destructive text-sm" role="alert">
          Ocurrió un error. Intenta de nuevo en unos momentos.
        </p>
      )}
    </form>
  )
}
