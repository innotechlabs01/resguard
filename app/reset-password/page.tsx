'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

function ExpiredState() {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">El enlace expiró</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Los enlaces de recuperación vencen después de 60 minutos o dejan de
          funcionar una vez usados. Solicita uno nuevo.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Solicitar nuevo enlace</Link>
        </Button>
      </CardContent>
    </>
  )
}

function SuccessState() {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Contraseña actualizada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tu contraseña fue actualizada. Por seguridad, cerramos todas las
          sesiones activas. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Button asChild className="w-full">
          <Link href="/sign-in">Ir a iniciar sesión</Link>
        </Button>
      </CardContent>
    </>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const linkFailed = searchParams.get('error') === 'expired'

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setSessionValid(!!data.session)
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setLoading(false)
      setError('Ocurrió un error. Intenta de nuevo en unos momentos.')
      return
    }
    // Invalidate every active session on all devices: after a recovery flow
    // the account must be re-authenticated with the new password everywhere.
    await supabase.auth.signOut({ scope: 'global' })
    setLoading(false)
    setSuccess(true)
  }

  if (linkFailed) return <ExpiredState />
  if (success) return <SuccessState />
  if (checkingSession) {
    return (
      <CardContent className="flex justify-center py-8">
        <Spinner />
      </CardContent>
    )
  }
  if (!sessionValid) return <ExpiredState />

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresa tu nueva contraseña y confírmala.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div aria-live="polite">
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Spinner />}
            {loading ? 'Actualizando…' : 'Restablecer contraseña'}
          </Button>
        </form>
      </CardContent>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <Suspense
          fallback={
            <CardContent className="flex justify-center py-8">
              <Spinner />
            </CardContent>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  )
}
