import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server Component / Route Handler Supabase client bound to the request
 * cookie store (official @supabase/ssr pattern). Read-only usage: unsafe
 * cookie writes from Server Components are ignored by Next.js; session
 * refresh is handled by middleware.
 *
 * Placeholder fallbacks mirror lib/supabase/client.ts so build-time
 * prerendering does not throw when env vars are absent.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component: cookie mutation is not allowed
          // here. Middleware refreshes sessions, so this is safe to ignore.
        }
      },
    },
  })
}
