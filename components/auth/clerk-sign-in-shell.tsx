'use client'

import { SignIn } from '@clerk/nextjs'
import { Shield, Sparkles } from 'lucide-react'

export function ClerkSignInShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-sidebar border-r border-border p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              ResGuard
            </span>
            <p className="text-xs text-muted-foreground">Copropiedad conectada</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Acceso seguro con tu cuenta
          </div>
          <h2 className="text-3xl font-bold text-foreground leading-tight text-balance">
            Entra a tu panel según tu rol
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Supervisión, administración de conjunto, portería o residente: cada perfil
            tiene su espacio. Si aún no tienes cuenta, pide acceso al administrador de
            tu copropiedad.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          ResGuard — gestión de propiedad horizontal
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground">ResGuard</span>
        </div>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full max-w-md',
              card: 'shadow-xl border border-border bg-card',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton:
                'border-border bg-background text-foreground',
              formButtonPrimary:
                'bg-primary text-primary-foreground hover:bg-primary/90',
            },
          }}
        />
      </div>
    </div>
  )
}
