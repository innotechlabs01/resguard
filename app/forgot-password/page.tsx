'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
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
      // Send OTP (6-digit code) via email instead of magic link
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false, // Don't create new users via recovery
        },
      })

      if (otpError) {
        // Anti-enumeration: don't reveal if email exists
        console.log('OTP send error (hidden):', otpError.message)
      }
      
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
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Código enviado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Si el correo está registrado, enviamos un <strong>código de 6 dígitos</strong> a <strong>{email}</strong>.
                Revisa tu bandeja de entrada (y spam).
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Ingresar código y restablecer
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push('/sign-in')}>
                ← Volver a iniciar sesión
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
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
                  {loading ? 'Enviando código…' : 'Enviar código de 6 dígitos'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/sign-in')}>
                  ← Volver a iniciar sesión
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}