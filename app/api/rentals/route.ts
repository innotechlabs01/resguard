import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getRentalListings, createRentalListing, deleteRentalListing, getRentalListingById } from '@/lib/db/queries/rentals'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/rentals' })

const CreateListingSchema = z.object({
  building_id: z.string().uuid(),
  type: z.enum(['apartment', 'room', 'parking', 'storage']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().min(0).max(100_000_000),
  currency: z.string().min(3).max(3).default('COP'),
  period: z.enum(['monthly', 'daily', 'yearly']).default('monthly'),
  rooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(10).optional(),
  area: z.number().min(0).max(10000).optional(),
  contact_phone: z.string().max(20).optional(),
  available_from: z.string().optional(),
})

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
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const listings = await getRentalListings(buildingId)
    return NextResponse.json({ listings })
  } catch (error) {
    log.error({ error }, 'Error fetching rental listings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = CreateListingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const access = assertBuildingAccess(user, parsed.data.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    await createRentalListing({
      owner_id: user.id,
      owner_name: user.name || user.email,
      owner_unit: '',
      building_id: parsed.data.building_id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      currency: parsed.data.currency,
      period: parsed.data.period,
      available: true,
      available_from: parsed.data.available_from ? new Date(parsed.data.available_from).toISOString() : new Date().toISOString(),
      rooms: parsed.data.rooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      area: parsed.data.area ?? null,
      parking_code: null,
      contact_phone: parsed.data.contact_phone || '',
      status: 'active',
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating rental listing')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    if (user.role !== 'super_admin') {
      const listing = await getRentalListingById(id)
      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
      if (listing.owner_id !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (user.role === 'admin' && listing.building_id !== user.building_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await deleteRentalListing(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error deleting rental listing')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
