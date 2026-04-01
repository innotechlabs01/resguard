import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getParkingSpots } from '@/lib/db/queries/parking'

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

    const spots = await getParkingSpots(buildingId)
    return NextResponse.json({ spots })
  } catch (error) {
    console.error('Error fetching parking spots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
