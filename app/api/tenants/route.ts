import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getTenants } from '@/lib/db/queries/tenants'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/tenants' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const tenants = await getTenants(buildingId)
    return NextResponse.json({ tenants })
  } catch (error) {
    log.error({ error }, 'Error fetching tenants')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
