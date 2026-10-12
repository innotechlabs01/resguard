import Link from 'next/link'
import {
  Megaphone,
  ClipboardList,
  CreditCard,
  Wrench,
  DoorOpen,
  MessageSquareWarning,
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
import { WaitlistForm } from '@/components/marketing/waitlist-form'

const PROBLEMS = [
  {
    icon: MessagesSquare,
    title: 'Avisos dispersos',
    description:
      'Comunicados por WhatsApp y papelotes en el ascensor que nadie lee y nadie puede rastrear.',
  },
  {
    icon: MessageSquareWarning,
    title: 'PQRS sin trazabilidad',
    description:
      'Peticiones y reclamos por correo o de palabra, sin registro, sin estado y sin respuesta medible.',
  },
  {
    icon: ReceiptText,
    title: 'Pagos manuales',
    description:
      'Administración cobrada por transferencia, conciliada a mano y sin cartera clara por unidad.',
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
          <h2 className="text-center text-3xl font-bold tracking-tight">Planes</h2>
          <div className="mx-auto mt-10 max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Plan Básico</CardTitle>
                <CardDescription>Para copropiedades pequeñas y medianas</CardDescription>
                <p className="mt-2 text-3xl font-bold">
                  $49.900 <span className="text-base font-normal text-muted-foreground">COP/mes</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {MODULES.map((module) => (
                    <li key={module.title} className="flex items-center gap-2">
                      <span aria-hidden>•</span> {module.title}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <a href="#waitlist">Únete a la lista</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA final + waitlist */}
      <section id="waitlist" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6 md:py-24">
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Administras una copropiedad? Hablemos.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Déjanos tu correo y te contactaremos para mostrarte ResGuard en tu
            edificio.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <WaitlistForm />
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
          <Link href="/sign-in" className="hover:text-foreground">
            Ya soy cliente
          </Link>
          <p>© {new Date().getFullYear()} Innotechlabs</p>
        </div>
      </footer>
    </div>
  )
}
