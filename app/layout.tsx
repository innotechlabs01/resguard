import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/providers/app-providers'
import { ErrorBoundary } from '@/components/error-boundary'
import { SwRegister } from '@/components/pwa/sw-register'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'ResGuard — Gestión de copropiedad para Colombia',
  description:
    'ResGuard centraliza avisos, PQRS, pagos, mantenimiento y portería de tu copropiedad. Simple para residentes, potente para administradores.',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    title: 'ResGuard',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  // Matches the semantic tokens: --background light/dark in styles/design-tokens.css.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7F8' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
        </ErrorBoundary>
        <SwRegister />
        <Analytics />
      </body>
    </html>
  )
}