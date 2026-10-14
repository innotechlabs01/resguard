'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react'

function ExpiredState() {
  const router = useRouter()
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Código expirado o inválido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          El código de recuperación venció (15 min) o ya fue usado. Solicita uno nuevo.
        </p>
        <Button asChild className="w-full">
          <a href="/forgot-password">Solicitar nuevo código</a>
        </Button>
      </CardContent>
    </>
  )
}

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

function VerifyOTPForm({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email',
      })

      if (verifyError) {
        setError(verifyError.message.includes('expired') 
          ? 'El código expiró. Solicita uno nuevo.' 
          : 'Código inválido. Verifica e intenta de nuevo.')
        return
      }

      onVerified()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleSubmit(new Event('submit') as any)
    }
  }, [code, loading])

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Verificar código</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enviamos un código de 6 dígitos a <strong>{email}</strong>
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
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoComplete="one-time-code"
              placeholder="0 0 0 0 0 0"
              className="text-center text-2xl tracking-widest font-mono"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            El código expira en 15 minutos. No lo compartas.
          </p>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading && <Spinner />}
            {loading ? 'Verificando…' : 'Verificar y continuar'}
          </Button>
        </form>
      </CardContent>
    </>
  )
}

function ResetPasswordForm() {
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
        setError('Error al actualizar. Intenta de nuevo.')
        return
      }
      await supabase.auth.signOut({ scope: 'global' })
      setSuccess(true)
    } catch {
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

// Wrapper that uses useSearchParams - needs Suspense boundary
function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [step, setStep] = useState<'verify' | 'reset'>('verify')

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password')
    }
  }, [email, router])

  if (!email) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        {step === 'verify' ? (
          <VerifyOTPForm email={email} onVerified={() => setStep('reset')} />
        ) : (
          <ResetPasswordForm />
        )}
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