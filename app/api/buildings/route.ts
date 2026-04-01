import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBuildings, getBuildingById, createBuilding, updateBuilding } from '@/lib/db/queries/buildings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const building = await getBuildingById(id)
      if (!building) {
        return NextResponse.json({ error: 'Building not found' }, { status: 404 })
      }
      return NextResponse.json({ building })
    }

    const buildings = await getBuildings()
    return NextResponse.json({ buildings })
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await createBuilding(body)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }
    await updateBuilding(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
