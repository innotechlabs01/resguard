'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react'

function SuccessState() {
  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Contraseña actualizada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Tu contraseña fue actualizada correctamente. Por seguridad, cerramos todas las sesiones activas.
        </p>
        <Button asChild className="w-full">
          <a href="/sign-in">Ir a iniciar sesión</a>
        </Button>
      </CardContent>
    </>
  )
}

function OtpInputStep({ email, onResend }: { email: string; onResend: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('El código debe ser de 6 dígitos')
      return
    }

    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'recovery',
      })

      if (verifyError) {
        setError(verifyError.message.includes('expired') 
          ? 'El código ha expirado. Solicita uno nuevo.' 
          : 'Código inválido. Verifica e inténtalo de nuevo.')
        return
      }

      // Session established - navigate to password form (same page, will re-render)
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Verificar código</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading && <Spinner />}
            {loading ? 'Verificando…' : 'Verificar código'}
          </Button>

          <Button variant="ghost" className="w-full" onClick={onResend} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reenviar código
          </Button>
        </form>
      </CardContent>
    </>
  )
}

function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        console.error('Update password error:', updateError)
        setError(updateError.message || 'Error al actualizar. Intenta de nuevo.')
        return
      }
      await supabase.auth.signOut({ scope: 'global' })
      setSuccess(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0 :
    password.length < 8 ? 1 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 3 : 2

  if (success) return <SuccessState />

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Nueva contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="pl-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${strength * 33}%`,
                  backgroundColor: strength === 1 ? 'red' : strength === 2 ? 'orange' : 'green'
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {strength === 0 ? 'Escribe tu contraseña' : strength === 1 ? 'Débil - usa mayúsculas, números y símbolos' : strength === 2 ? 'Media - añade más variedad' : 'Fuerte'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repite la contraseña"
                className="pl-10"
              />
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
            )}
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

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [step, setStep] = useState<'otp' | 'password'>('otp')
  const [hasSession, setHasSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check for existing recovery session (from verifyOtp)
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  const handleResend = async () => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center py-8">
            <Spinner />
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no email in URL and no session, send back to forgot-password
  if (!email && !hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Enlace inválido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Falta el correo en el enlace. Solicita un nuevo código.
            </p>
            <Button asChild className="w-full">
              <a href="/forgot-password">Solicitar código</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we have a session (from verifyOtp), show password form
  if (hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          {email && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Mail className="h-4 w-4" />
                <span>Restableciendo para: <strong>{email}</strong></span>
              </div>
            </div>
          )}
          <ResetPasswordForm email={email} />
        </Card>
      </div>
    )
  }

  // Otherwise show OTP input
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <OtpInputStep email={email} onResend={handleResend} />
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}