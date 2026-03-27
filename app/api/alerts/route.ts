import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAlerts } from '@/lib/db/queries/alerts'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId') ?? undefined

    const alerts = await getAlerts(buildingId)
    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
