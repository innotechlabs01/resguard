import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCommunications } from '@/lib/db/queries/communications'

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

    const communications = await getCommunications(buildingId)
    return NextResponse.json({ communications })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
