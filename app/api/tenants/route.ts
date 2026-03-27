import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTenants } from '@/lib/db/queries/tenants'

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

    const tenants = await getTenants(buildingId)
    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
