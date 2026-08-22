import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getMarketplaceProducts } from '@/lib/db/queries/marketplace'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/marketplace' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const products = await getMarketplaceProducts(buildingId)
    return NextResponse.json({ products })
  } catch (error) {
    log.error({ error }, 'Error fetching marketplace products')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
