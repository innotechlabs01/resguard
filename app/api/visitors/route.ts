import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getVisitors, createVisitor, updateVisitor, deleteVisitor } from '@/lib/db/queries/visitors'

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

    const visitors = await getVisitors(buildingId)
    return NextResponse.json({ visitors })
  } catch (error) {
    console.error('Error fetching visitors:', error)
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
    
    const visitorData = {
      building_id: body.building_id,
      name: body.name,
      document_id: body.document_id,
      type: body.type || 'pedestrian',
      vehicle_plate: body.vehicle_plate || null,
      destination_unit: body.destination_unit,
      resident_name: body.resident_name,
      entry_time: body.entry_time || new Date().toISOString(),
      status: body.status || 'inside',
      exit_time: body.exit_time || null,
      parking_spot: body.parking_spot || null,
    }

    await createVisitor(visitorData)
    return NextResponse.json({ success: true, message: 'Visitor registered successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating visitor:', error)
    return NextResponse.json({ error: 'Failed to register visitor', details: String(error) }, { status: 500 })
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
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 })
    }

    await updateVisitor(id, updates)
    return NextResponse.json({ success: true, message: 'Visitor updated successfully' })
  } catch (error) {
    console.error('Error updating visitor:', error)
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 })
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
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 })
    }

    await deleteVisitor(id)
    return NextResponse.json({ success: true, message: 'Visitor deleted successfully' })
  } catch (error) {
    console.error('Error deleting visitor:', error)
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 })
  }
}
