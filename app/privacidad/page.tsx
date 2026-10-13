import type { Metadata } from 'next'
import { LegalPage } from '@/components/marketing/legal-page'

export const metadata: Metadata = {
  title: 'Privacidad — ResGuard',
  description: 'Política de privacidad de ResGuard.',
}

export default function PrivacidadPage() {
  return <LegalPage title="Política de privacidad" />
}
