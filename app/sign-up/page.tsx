'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp
        routing="path"
        path="/sign-up"
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
  )
}
