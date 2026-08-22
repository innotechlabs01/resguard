import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getProviders, createProvider } from '@/lib/db/queries/providers'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/providers' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const category = searchParams.get('category') || undefined

    const providers = await getProviders(buildingId, category)
    return NextResponse.json({ providers })
  } catch (error) {
    log.error({ error }, 'Error fetching providers')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { building_id, name, category, phone, whatsapp, email, description } = body

    if (!building_id || !name || !category || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validCategories = ['plumber', 'electrician', 'painter', 'carpenter', 'appliance_repair', 'locksmith', 'cleaning', 'gardening', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const provider = await createProvider({
      building_id,
      name,
      category,
      phone,
      whatsapp,
      email,
      description,
      verified_by: user.name || user.email,
    })

    return NextResponse.json({ provider }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating provider')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
