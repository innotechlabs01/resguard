import Link from 'next/link'
import {
  Megaphone,
  ClipboardList,
  CreditCard,
  Wrench,
  DoorOpen,
  ReceiptText,
  MessagesSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LandingHeader } from '@/components/marketing/landing-header'
import { ContactForm } from '@/components/marketing/contact-form'
import { PwaInstallBanner } from '@/components/pwa/pwa-install-banner'

const PROBLEMS = [
  {
    icon: DoorOpen,
    title: 'Portería por papel y teléfono',
    description:
      'Registro de visitantes en papelotes y autorizaciones por llamada, sin historial confiable.',
  },
  {
    icon: ReceiptText,
    title: 'Pagos dispersos',
    description:
      'La administración se cobra por transferencias sueltas, se concilia a mano y la cartera se pierde.',
  },
  {
    icon: MessagesSquare,
    title: 'Comunicación por WhatsApp caótica',
    description:
      'Comunicados y reclamos mezclados en grupos de WhatsApp donde todo se pierde y nadie lee.',
  },
]

// Solo módulos que existen en el producto (verificado contra el código):
// avisos/comunicaciones, PQRS, pagos con Bold, mantenimiento, visitantes/portería.
const MODULES = [
  {
    icon: Megaphone,
    title: 'Avisos y comunicaciones',
    description:
      'Comunicados oficiales del administrador a todos los residentes, en un solo canal.',
  },
  {
    icon: ClipboardList,
    title: 'PQRS',
    description:
      'Peticiones, quejas, reclamos y sugerencias con registro y seguimiento de estado.',
  },
  {
    icon: CreditCard,
    title: 'Pagos con Bold',
    description:
      'Cobro de administración y cuotas con pasarela de pago colombiana integrada.',
  },
  {
    icon: Wrench,
    title: 'Mantenimiento',
    description:
      'Gestión de solicitudes y trabajos de mantenimiento de la copropiedad.',
  },
  {
    icon: DoorOpen,
    title: 'Visitantes y portería',
    description:
      'Control de acceso: registro de visitantes y operación diaria de la portería.',
  },
]

const STEPS = [
  {
    step: 1,
    title: 'Configura tu edificio',
    description: 'El administrador crea la copropiedad, las unidades y las cuotas.',
  },
  {
    step: 2,
    title: 'Invita residentes y vigilantes',
    description: 'Cada persona entra con su rol: administrador, vigilante o residente.',
  },
  {
    step: 3,
    title: 'Opera todo desde el dashboard',
    description: 'Avisos, PQRS, pagos, mantenimiento y portería en un solo lugar.',
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 md:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Gestión de copropiedad para Colombia
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
          Tu edificio, bajo control desde un solo lugar
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          ResGuard centraliza portería, pagos, visitas y comunicación de tu
          copropiedad. Simple para residentes, potente para administradores.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="#waitlist">Solicitar demo</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#modulos">Ver módulos</a>
          </Button>
        </div>
      </section>

      {/* Visual: screenshot del dashboard en Card con borde glow */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Card className="relative overflow-hidden border-primary/40 shadow-[0_0_60px_-15px] shadow-primary/40">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
            aria-hidden
          />
          <div className="flex h-64 flex-col gap-3 p-4 sm:h-80 md:h-96" aria-hidden>
            <div className="flex gap-3">
              <div className="hidden w-40 shrink-0 space-y-2 rounded-md border border-border bg-card p-3 sm:block">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                  </div>
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                  </div>
                  <div className="hidden rounded-md border border-border bg-card p-3 md:block">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
                  </div>
                </div>
                <div className="flex-1 rounded-md border border-border bg-card p-3">
                  <div className="h-3 w-1/4 rounded bg-muted" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-4/6 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span className="sr-only">
            Vista previa del panel de administración de ResGuard
          </span>
        </Card>
      </section>

      {/* Problema */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            ¿Te suena familiar?
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <Card key={problem.title}>
                <CardHeader>
                  <problem.icon className="size-8 text-muted-foreground" aria-hidden />
                  <CardTitle className="mt-2">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {problem.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Un solo sistema para operar tu copropiedad
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            El administrador trabaja desde el panel web y el residente desde la
            app móvil. Estos son los módulos disponibles hoy:
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module) => (
              <Card key={module.title}>
                <CardHeader>
                  <module.icon className="size-8 text-muted-foreground" aria-hidden />
                  <CardTitle className="mt-2">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border text-lg font-semibold">
                  {step.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">Planes de afiliación mensual</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Elige según el tamaño de tu operación. El precio final se ajusta a tu
            número de edificios y unidades — hablemos y te damos una propuesta.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Básico */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Básico</CardTitle>
                <CardDescription>Para un edificio que empieza</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-foreground">
                  $99.000
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 1 edificio, hasta 100 unidades</li>
                  <li>✓ Residentes y visitantes</li>
                  <li>✓ Parqueaderos</li>
                  <li>✓ Comunicados y avisos</li>
                  <li>✓ Notificaciones</li>
                  <li>✓ Soporte por email</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <a href="#hablemos">Hablemos</a>
                </Button>
              </CardContent>
            </Card>

            {/* Profesional */}
            <Card className="relative border-primary/50 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Más popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Profesional</CardTitle>
                <CardDescription>Para administradores con portafolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-foreground">
                  $199.000
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Hasta 5 edificios</li>
                  <li>✓ Todo lo del plan Básico</li>
                  <li>✓ Pagos y cobros (Bold)</li>
                  <li>✓ Reservas zonas comunes</li>
                  <li>✓ Reportes de vigilancia</li>
                  <li>✓ PQRS y mesa de ayuda</li>
                  <li>✓ Soporte prioritario</li>
                </ul>
                <Button asChild className="w-full">
                  <a href="#hablemos">Hablemos</a>
                </Button>
              </CardContent>
            </Card>

            {/* Corporativo */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Corporativo</CardTitle>
                <CardDescription>Para grandes portafolios (6+ edificios)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-foreground">
                  Custom
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Edificios ilimitados (24, 50, 100+)</li>
                  <li>✓ Todo lo del plan Profesional</li>
                  <li>✓ Panel multi-edificio centralizado</li>
                  <li>✓ Onboarding asistido</li>
                  <li>✓ Soporte dedicado</li>
                  <li>✓ Capacitación del equipo</li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <a href="#hablemos">Hablemos</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Todos los planes incluyen la PWA instalable, actualizaciones y seguridad.
            Sin contratos de permanencia.
          </p>
        </div>
      </section>

      {/* CTA final + contact form */}
      <section id="hablemos" className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-center">
            ¿Administras una copropiedad? Hablemos.
          </h2>
          <p className="mt-4 max-w-xl text-center text-muted-foreground">
            Cuéntanos qué necesitas y te mostramos ResGuard funcionando con tus
            edificios. Sin compromiso — la demo es gratis.
          </p>
          <div className="mt-10 w-full max-w-2xl">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row">
          <p className="font-semibold text-foreground">ResGuard</p>
          <p>
            Contacto:{' '}
            <a href="mailto:hola@innotechlabs.co" className="hover:text-foreground">
              hola@innotechlabs.co
            </a>
          </p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/terminos" className="hover:text-foreground">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad
            </Link>
          </nav>
          <Link href="/sign-in" className="hover:text-foreground">
            Ya soy cliente
          </Link>
          <p>© {new Date().getFullYear()} Innotechlabs</p>
        </div>
      </footer>

      <PwaInstallBanner />
    </div>
  )
}
