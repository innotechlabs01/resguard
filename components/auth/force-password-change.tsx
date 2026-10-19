'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

/**
 * ForcePasswordChange: shown on first login when the user's auth metadata
 * contains must_change_password=true (set by POST /api/users when the admin
 * provisions an account with a generated temp password).
 *
 * The dialog cannot be dismissed until the password is changed.
 * After a successful change, the metadata flag is cleared.
 */
export function ForcePasswordChange() {
  const { user, isLoaded } = useAuth()
  const [mustChange, setMustChange] = useState(false)
  const [checking, setChecking] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) {
      setChecking(false)
      return
    }
    // Check the Supabase auth session for the must_change_password flag
    import('@/lib/supabase/client').then(async ({ supabase }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const flag = session?.user?.user_metadata?.must_change_password
      setMustChange(Boolean(flag))
      setChecking(false)
    }).catch(() => setChecking(false))
  }, [isLoaded, user])

  const handleChangePassword = async () => {
    setError(null)

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword === 'temp') {
      setError('Elige una contraseña diferente a la temporal.')
      return
    }

    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) {
        setError(updateError.message || 'No se pudo actualizar la contraseña.')
        return
      }

      // Clear the must_change_password flag in metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { must_change_password: false }
      })
      if (metaError) {
        // Non-blocking: the password was changed, flag cleanup is best-effort
        console.warn('Failed to clear must_change_password flag:', metaError)
      }

      setDone(true)
      setMustChange(false)
      // Auto-close after showing success
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (checking || !mustChange || !user) return null

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[420px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Cambia tu contraseña
          </DialogTitle>
          <DialogDescription>
            Estás usando una contraseña temporal generada por el administrador.
            Crea tu propia contraseña para continuar.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-sm text-muted-foreground">
              Contraseña actualizada. Redirigiendo…
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg" role="alert">
                {error}
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
                  if (e.key === 'Enter' && !saving) handleChangePassword()
                }}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
