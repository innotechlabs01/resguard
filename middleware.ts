import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up', 
  '/forgot-password',
  '/reset-password',
  '/auth/confirm', // keep for any legacy links
]

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths. "/" is an exact match (never a prefix) because
  // startsWith('/') would open every route. app/page.tsx self-gates: it
  // renders <AppContainer/> for a session, <Landing/> for visitors.
  if (pathname === '/' || PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  // Official @supabase/ssr middleware pattern
  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // No session -> redirect to sign-in
  if (!session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const response = NextResponse.next({ request })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  )
  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}