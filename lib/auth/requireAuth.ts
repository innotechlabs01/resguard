import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserById, type DbUser } from '@/lib/db/queries/users'

export type Role = 'super_admin' | 'admin' | 'vigilante' | 'usuario'

export async function requireAuth(
  req: Request,
  allowedRoles?: Role[]
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set() {},
        remove() {}
      }
    }
  )
  const authHeader = req.headers.get('authorization')
  let user
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data } = await supabase.auth.getUser(token)
    user = data.user
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dbUser = await getUserById(user.id)
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(dbUser.role as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  return { user: dbUser, supabaseId: user.id }
}

export function isAuthResponse(v: unknown): v is Response {
  return v instanceof Response
}
