import { AppContainer } from '@/components/app-container'
import { Landing } from '@/components/marketing/landing'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Single entry point ("/"): authenticated users get the in-app dashboard
 * (AppContainer, role view-switching); visitors get the public landing.
 * The middleware (lib middleware.ts) already confines recovery sessions to
 * /reset-password, so any session seen here is a full app session.
 */
export default async function Home() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return <AppContainer />
  }

  return <Landing />
}
