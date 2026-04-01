import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getResidents } from '@/lib/db/queries/residents'

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

    const residents = await getResidents(buildingId)
    return NextResponse.json({ residents })
  } catch (error) {
    console.error('Error fetching residents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
