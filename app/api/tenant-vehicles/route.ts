import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getTenantVehicles } from '@/lib/db/queries/tenant-vehicles'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/tenant-vehicles' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const vehicles = await getTenantVehicles(tenantId)
    return NextResponse.json({ vehicles })
  } catch (error) {
    log.error({ error }, 'Error fetching tenant vehicles')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
