'use client'

import { useRouter } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ClerkSignInShell() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between border-r border-border p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              ResGuard
            </span>
            <p className="text-xs text-muted-foreground">Propiedad horizontal</p>
          </div>
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
            {['Super Administrador', 'Administrador', 'Vigilante / Portero', 'Residente'].map((role) => (
              <div key={role} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span>{role}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          ResGuard &mdash; Propiedad horizontal en Colombia
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="mb-6 flex w-full max-w-md">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">ResGuard</span>
        </div>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full max-w-md',
              card: 'border border-border bg-card shadow-none',
              headerTitle: 'text-foreground font-semibold',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton:
                'border-border bg-secondary text-foreground hover:bg-secondary/80',
              formButtonPrimary:
                'bg-foreground text-background hover:bg-foreground/90 font-medium',
              formFieldInput:
                'bg-secondary border-border text-foreground',
              footerActionLink: 'text-foreground hover:text-foreground/80',
            },
          }}
        />
      </div>
    </div>
  )
}
