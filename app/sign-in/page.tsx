'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(
        error.message.includes('Invalid login')
          ? 'Correo o contraseña incorrectos. Verifica tus datos.'
          : error.message
      )
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-2">
      {/* Branding side — desktop only */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary/10 via-background to-background p-12 lg:p-16">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">ResGuard</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Gestiona tu copropiedad
            <br />
            <span className="text-primary">sin desorden.</span>
          </h1>

          <div className="space-y-4">
            {[
              { icon: '📢', label: 'Comunicados y avisos que llegan a todos' },
              { icon: '🚗', label: 'Visitantes y parqueaderos bajo control' },
              { icon: '💳', label: 'Pagos y cobros sin filas' },
              { icon: '📅', label: 'Reservas de zonas comunes en segundos' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <p className="text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          La plataforma que conecta residentes, vigilantes y administración.
        </p>
      </div>

      {/* Form side */}
      <div className="flex min-h-screen items-center justify-center p-6 md:min-h-0">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="md:hidden flex flex-col items-center gap-3 pt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold text-foreground">ResGuard</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">
              Bienvenido de nuevo. Ingresa a tu panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Problemas para entrar?{' '}
            <Link href="/#contacto" className="text-primary hover:underline">
              Contacta a tu administrador
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
