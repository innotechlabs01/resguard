'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Building2, Eye, User, ChevronRight, ArrowLeft, Lock, Mail, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { mockUsers, mockBuildingStats } from '@/lib/mock-data'
import type { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

const roleConfig: Record<
  UserRole,
  { icon: typeof Shield; title: string; description: string; accent: string; bgAccent: string; borderAccent: string }
> = {
  super_admin: {
    icon: Shield,
    title: 'Super Administrador',
    description: 'Control global del sistema, edificios y facturacion',
    accent: 'text-foreground',
    bgAccent: 'bg-secondary',
    borderAccent: 'border-border hover:border-foreground/30',
  },
  admin: {
    icon: Building2,
    title: 'Administrador',
    description: 'Gestion del edificio, residentes y comunicaciones',
    accent: 'text-foreground',
    bgAccent: 'bg-secondary',
    borderAccent: 'border-border hover:border-foreground/30',
  },
  vigilante: {
    icon: Eye,
    title: 'Vigilante / Portero',
    description: 'Control de acceso, visitantes y parqueaderos',
    accent: 'text-foreground',
    bgAccent: 'bg-secondary',
    borderAccent: 'border-border hover:border-foreground/30',
  },
  usuario: {
    icon: User,
    title: 'Residente',
    description: 'Pagos, reservas, parqueo de visitas y mas',
    accent: 'text-foreground',
    bgAccent: 'bg-secondary',
    borderAccent: 'border-border hover:border-foreground/30',
  },
}

type Step = 'role' | 'login'

function hasClerkKey() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim().length)
}

export function LandingPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const usersForRole = selectedRole ? mockUsers.filter((u) => u.role === selectedRole) : []

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const first = mockUsers.find((u) => u.role === role)
    setSelectedUserId(first?.id || '')
    setStep('login')
  }

  const handleLogin = () => {
    if (!selectedUserId) return
    setIsLoading(true)
    setTimeout(() => {
      setSuccess(true)
      setTimeout(() => {
        login(selectedUserId)
      }, 700)
    }, 900)
  }

  const selectedUser = mockUsers.find((u) => u.id === selectedUserId)
  const selectedBuilding = selectedUser?.buildingId
    ? mockBuildingStats.find((b) => b.id === selectedUser.buildingId)
    : null
  const cfg = selectedRole ? roleConfig[selectedRole] : null

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between border-r border-border p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">ResGuard</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-foreground leading-tight tracking-tight">
              Sistema de Gestion de Propiedad Horizontal
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Administracion inteligente de conjuntos residenciales. Control de acceso, parqueaderos,
              pagos, comunicaciones y mucho mas en una sola plataforma.
            </p>
          </div>

          <div className="space-y-3">
            {(['super_admin', 'admin', 'vigilante', 'usuario'] as UserRole[]).map((role) => {
              const r = roleConfig[role]
              const Icon = r.icon
              return (
                <div key={role} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{r.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          ResGuard &mdash; Propiedad horizontal en Colombia
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-3 lg:hidden mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">ResGuard</span>
          </div>

          {step === 'role' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Bienvenido</h1>
                <p className="text-sm text-muted-foreground">Selecciona tu tipo de perfil para continuar</p>
              </div>

              {/* Clerk login button */}
              {hasClerkKey() && (
                <>
                  <Button
                    className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium"
                    onClick={() => router.push('/sign-in')}
                  >
                    Iniciar sesion real
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">o entra como demo</span>
                    </div>
                  </div>
                </>
              )}

              {/* Role cards */}
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                  const r = roleConfig[role]
                  const Icon = r.icon
                  const count = mockUsers.filter((u) => u.role === role).length
                  return (
                    <Card
                      key={role}
                      className={cn(
                        'cursor-pointer border bg-card transition-colors duration-150',
                        r.borderAccent
                      )}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <CardContent className="p-4">
                        <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-md', r.bgAccent)}>
                          <Icon className={cn('h-4 w-4', r.accent)} />
                        </div>
                        <p className="font-medium text-foreground text-sm leading-tight">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{r.description}</p>
                        <Badge variant="outline" className="mt-3 text-xs border-border text-muted-foreground">
                          {count} {count === 1 ? 'usuario' : 'usuarios'}
                        </Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {!hasClerkKey() && (
                <p className="text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg py-2.5 px-3">
                  Modo demostracion: elige un perfil y un usuario de ejemplo para explorar la plataforma.
                </p>
              )}
            </div>
          )}

          {step === 'login' && cfg && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setStep('role')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">Iniciar sesion</h1>
                  <p className="text-xs text-muted-foreground">Perfil: {cfg.title}</p>
                </div>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                {(() => { const Icon = cfg.icon; return <Icon className="h-5 w-5 shrink-0 text-foreground" /> })()}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{cfg.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{cfg.description}</p>
                </div>
              </div>

              {/* User selector */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Seleccionar usuario</Label>
                <div className="space-y-2">
                  {usersForRole.map((u) => {
                    const bld = u.buildingId ? mockBuildingStats.find((b) => b.id === u.buildingId) : null
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                          selectedUserId === u.id
                            ? 'border-foreground/40 bg-secondary'
                            : 'border-border bg-card hover:bg-secondary/60'
                        )}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {bld ? bld.name : 'Acceso global'} &mdash; {u.email}
                          </p>
                        </div>
                        {selectedUserId === u.id && (
                          <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Simulated credentials */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Correo electronico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={selectedUser?.email || ''}
                      className="pl-10 bg-secondary border-border text-foreground cursor-default"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      readOnly
                      value="••••••••"
                      className="pl-10 bg-secondary border-border text-foreground cursor-default"
                    />
                  </div>
                </div>
              </div>

              {selectedBuilding && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg border border-border bg-secondary p-2.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Edificio: <span className="text-foreground font-medium">{selectedBuilding.name}</span></span>
                </div>
              )}

              <Button
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 font-medium"
                disabled={!selectedUserId || isLoading}
                onClick={handleLogin}
              >
                {success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Acceso concedido
                  </>
                ) : isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Ingresar al sistema
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
