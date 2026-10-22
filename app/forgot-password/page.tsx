'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Mail, CheckCircle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      // Send password reset email with OTP code (no redirectTo - uses {{ .Token }} template)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())

      if (resetError) {
        console.log('Reset email error:', resetError.message)
        setError(resetError.message || 'No se pudo enviar el código. Intenta de nuevo.')
        return
      }
      
      setSuccess(true)
    } catch {
      setError('Ocurrió un error. Intenta de nuevo en unos momentos.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Código enviado</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Te enviamos un código de 6 dígitos a <strong>{email}</strong>.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href={`/reset-password?email=${encodeURIComponent(email)}`}>
                Ir a restablecer contraseña
              </a>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/sign-in')}>
              ← Volver a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Recuperar contraseña</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Ingresa tu correo y te enviaremos un código de 6 dígitos para crear una nueva contraseña.
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
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />}
              {loading ? 'Enviando código…' : 'Enviar código de recuperación'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/sign-in')}>
              ← Volver a iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}