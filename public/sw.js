// ResGuard service worker — minimal PWA shell + Firebase Cloud Messaging.
//
// FCM handler lives in /firebase-messaging-sw.js and is merged here via
// importScripts so a SINGLE service worker owns the "/" scope. Any eager
// cache cleanup runs before FCM continues its own setup.
// FCM is a progressive enhancement: if the messaging script fails to load
// (404, CSP, network), the main SW must survive so PWA install/offline still work.
try {
  importScripts('/firebase-messaging-sw.js')
} catch (error) {
  console.error('[sw] Failed to load Firebase messaging SW — push disabled, PWA continues:', error)
}

const CACHE_NAME = 'resguard-shell-v1'

// Never touch these: API data is multi-tenant sensitive and auth flows must
// always hit the network.
function isBypassed(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')
}

self.addEventListener('install', (event) => {
  // No precache: keep the shell minimal; navigation is network-first below.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up caches from older versions of this SW.
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only GET over our own origin; never intercept /api/* or /auth/*.
  if (request.method !== 'GET' || url.origin !== self.location.origin || isBypassed(url)) {
    return
  }

  // Navigations: network-first with no offline fallback cache of HTML
  // (avoids serving stale authenticated pages).
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request))
    return
  }
})
