import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getResidents, createResident, updateResident, deleteResident } from '@/lib/db/queries/residents'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/residents' })

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const residents = await getResidents(buildingId)
    return NextResponse.json({ residents })
  } catch (error) {
    log.error({ error }, 'Error fetching residents')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    
    const residentData = {
      building_id: body.building_id,
      user_id: body.user_id || null,
      name: body.name,
      unit: body.unit,
      phone: body.phone || null,
      email: body.email || null,
      parking_spots: body.parking_spots || null,
      balance: body.balance || 0,
      is_tenant: body.is_tenant || false,
      owner_id: body.owner_id || null,
      owner_name: body.owner_name || null,
      lease_end: body.lease_end || null,
      has_rental_listing: body.has_rental_listing || false,
      has_marketplace_listing: body.has_marketplace_listing || false,
    }

    await createResident(residentData)
    return NextResponse.json({ success: true, message: 'Resident created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating resident')
    return NextResponse.json({ error: 'Failed to create resident', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Resident ID required' }, { status: 400 })
    }

    await updateResident(id, updates)
    return NextResponse.json({ success: true, message: 'Resident updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating resident')
    return NextResponse.json({ error: 'Failed to update resident' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Resident ID required' }, { status: 400 })
    }

    await deleteResident(id)
    return NextResponse.json({ success: true, message: 'Resident deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting resident')
    return NextResponse.json({ error: 'Failed to delete resident' }, { status: 500 })
  }
}
