import Link from 'next/link'

/**
 * Minimal placeholder shell for the legal pages (/terminos, /privacidad).
 * Server component, same visual language as the marketing landing
 * (simple sticky header + centered content). Content is intentionally
 * a neutral placeholder — no legal text has been drafted yet.
 */
export function LegalPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ResGuard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-6 text-muted-foreground">
          Documento en preparación. Este contenido estará disponible
          próximamente. Contacto:{' '}
          <a
            href="mailto:hola@innotechlabs.co"
            className="text-foreground underline underline-offset-4"
          >
            hola@innotechlabs.co
          </a>
          .
        </p>
        <p className="mt-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </Link>
        </p>
      </main>
    </div>
  )
}
