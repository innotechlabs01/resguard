import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getMarketplaceProducts } from '@/lib/db/queries/marketplace'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/marketplace' })

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
