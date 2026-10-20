'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * Self-registration gate: in production, sign-up is disabled by default.
 * Set NEXT_PUBLIC_ALLOW_SIGNUP=true to enable (e.g., for QA/testing).
 * The admin provisions users via the panel (with generated passwords).
 */
const ALLOW_SIGNUP =
  process.env.NEXT_PUBLIC_ALLOW_SIGNUP === 'true' ||
  process.env.APP_SCOPE !== 'PRODUCTION'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/sign-in')
    }
  }

  // Gate: self-signup disabled in production
  if (!ALLOW_SIGNUP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8 border rounded-lg bg-card text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Registro no disponible</h1>
          <p className="text-muted-foreground text-sm">
            Las cuentas se crean desde el panel del administrador del edificio.
            Si eres residente, contacta a tu administración para obtener acceso.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-6 border rounded-lg bg-card">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta quedará pendiente de asignación a un edificio.
        </p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="text-sm">Nombre</label>
          <input className="w-full mt-1 p-2 border rounded bg-secondary" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <input className="w-full mt-1 p-2 border rounded bg-secondary" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm">Contraseña</label>
          <input className="w-full mt-1 p-2 border rounded bg-secondary" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="w-full p-2 bg-foreground text-background rounded">
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
