import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRentalListings } from '@/lib/db/queries/rentals'

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

    const listings = await getRentalListings(buildingId)
    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching rental listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
