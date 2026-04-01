import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAssemblies, createAssembly, getAssemblyById, updateAssemblyStatus } from '@/lib/db/queries/assemblies'

export const dynamic = 'force-dynamic'

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

    const assemblies = await getAssemblies(buildingId)
    return NextResponse.json({ assemblies })
  } catch (error) {
    console.error('Error fetching assemblies:', error)
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
    const { buildingId, title, description, date, time, location, sendNotification } = body

    if (!buildingId || !title || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = await createAssembly({
      building_id: buildingId,
      title,
      description: description || '',
      date,
      time,
      location: location || '',
      status: 'scheduled',
      created_by: userId,
    })

    return NextResponse.json({ id, message: 'Assembly created successfully' })
  } catch (error) {
    console.error('Error creating assembly:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}