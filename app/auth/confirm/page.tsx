'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'set-password' | 'error' | 'done'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const verify = async () => {
      // Supabase sends: ?token_hash=xxx&type=invite&redirect_to=...
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!token_hash || !type) {
        setStatus('error')
        setErrorMessage('Enlace inválido. Solicita una nueva invitación al administrador de tu edificio.')
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'invite' | 'signup' | 'recovery' | 'email',
      })

      if (error) {
        setStatus('error')
        if (error.message.includes('expired')) {
          setErrorMessage('El enlace ha expirado (por seguridad, dura 1 hora). Solicita una nueva invitación.')
        } else {
          setErrorMessage('Enlace inválido o ya utilizado. Solicita una nueva invitación.')
        }
        return
      }

      // Token verified — session established. Show password setup.
      setStatus('set-password')
    }

    verify()
  }, [searchParams])

  const handleSetPassword = async () => {
    setErrorMessage(null)

    if (newPassword.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setErrorMessage(error.message || 'No se pudo guardar la contraseña.')
        return
      }

      setStatus('done')
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch {
      setErrorMessage('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">ResGuard</h1>
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando enlace seguro…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="border border-destructive/20 rounded-lg bg-destructive/5 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-semibold text-foreground">Enlace no válido</h2>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Contacta al administrador de tu edificio para recibir una nueva invitación.
            </p>
          </div>
        )}

        {status === 'set-password' && (
          <div className="border border-border rounded-lg bg-card p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Define tu contraseña</h2>
              <p className="text-sm text-muted-foreground">
                Tu identidad ha sido verificada. Crea una contraseña segura para acceder a la plataforma.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving) handleSetPassword()
                }}
              />
            </div>

            <Button
              onClick={handleSetPassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Guardando…' : 'Crear contraseña y entrar'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              🔒 Este enlace es de un solo uso y ya fue verificado.
              Nadie más puede usarlo.
            </p>
          </div>
        )}

        {status === 'done' && (
          <div className="border border-success/20 rounded-lg bg-success/5 p-6 space-y-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
            <h2 className="font-semibold text-foreground">¡Contraseña creada!</h2>
            <p className="text-sm text-muted-foreground">
              Redirigiendo a tu panel…
            </p>
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthConfirmInner />
    </Suspense>
  )
}
