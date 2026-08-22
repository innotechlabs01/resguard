import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserByClerkId, type DbUser } from '@/lib/db/queries/users'

export type Role = 'super_admin' | 'admin' | 'vigilante' | 'usuario'

export async function requireAuth(
  _req: Request,
  allowedRoles?: Role[]
): Promise<{ user: DbUser; clerkId: string } | Response> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await getUserByClerkId(userId)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  return { user, clerkId: userId }
}

export function isAuthResponse(v: unknown): v is Response {
  return v instanceof Response
}
