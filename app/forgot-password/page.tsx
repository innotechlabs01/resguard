'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const origin = window.location.origin
      // Anti-enumeration: the same "sent" screen is shown whether or not the
      // email is registered. Supabase errors (including rate limits) do not
      // reveal account existence, so treat them as sent as well.
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/confirm`,
      })
      setSent(true)
    } catch {
      setError('Ocurrió un error. Intenta de nuevo en unos momentos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        {sent ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si ese correo está registrado, te enviamos un link para recuperar tu cuenta.
                Puede tardar unos minutos; revisa también la carpeta de spam.
              </p>
              <Link
                href="/sign-in"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                ← Volver a iniciar sesión
              </Link>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresa el correo asociado a tu cuenta y te enviaremos un enlace de recuperación.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-destructive text-sm" role="alert">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Spinner />}
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </Button>
                <Link
                  href="/sign-in"
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Volver a iniciar sesión
                </Link>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
