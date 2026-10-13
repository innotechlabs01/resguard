import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that must stay reachable without any session check (entry points of
// the auth flows themselves).
const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/auth/confirm']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  // Official @supabase/ssr middleware pattern: server client bound to
  // request/response cookies (Edge-safe, no Node APIs). Cookie mutations
  // (e.g. token refresh) are collected and applied to the final response.
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

  // A password-recovery session is a FULL app session (Supabase design). Gate
  // it: sessions whose AMR claim contains method 'recovery' may only reach
  // /reset-password; anything else kills the session and bounces to /sign-in.
  // Same AMR check as app/reset-password/page.tsx.
  const amr = (session?.user as { amr?: unknown } | undefined)?.amr
  const isRecoverySession = Array.isArray(amr)
    ? amr.some((entry) =>
        typeof entry === 'string'
          ? entry === 'recovery'
          : entry?.method === 'recovery',
      )
    : false

  if (isRecoverySession && !pathname.startsWith('/reset-password')) {
    await supabase.auth.signOut()
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('message', 'session-ended')
    const redirect = NextResponse.redirect(redirectUrl)
    // signOut's cookie clearing landed in pendingCookies; apply it here.
    pendingCookies.forEach(({ name, value, options }) =>
      redirect.cookies.set(name, value, options),
    )
    return redirect
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
