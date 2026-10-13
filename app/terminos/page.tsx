import type { Metadata } from 'next'
import { LegalPage } from '@/components/marketing/legal-page'

export const metadata: Metadata = {
  title: 'Términos — ResGuard',
  description: 'Términos del servicio de ResGuard.',
}

export default function TerminosPage() {
  return <LegalPage title="Términos del servicio" />
}
