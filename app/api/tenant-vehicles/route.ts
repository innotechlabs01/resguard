import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTenantVehicles } from '@/lib/db/queries/tenant-vehicles'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const vehicles = await getTenantVehicles(tenantId)
    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error fetching tenant vehicles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
