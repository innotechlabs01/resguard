import type { MetadataRoute } from 'next'

// NOTE: icons are neutral placeholders ("RG" monogram on dark background).
// Replace with final brand assets from T-015/landing design before release.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ResGuard — Gestión de copropiedad',
    short_name: 'ResGuard',
    description:
      'ResGuard centraliza avisos, PQRS, pagos, mantenimiento y portería de tu copropiedad.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
