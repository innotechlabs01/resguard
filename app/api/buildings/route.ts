import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBuildings, getBuildingById, createBuilding, updateBuilding } from '@/lib/db/queries/buildings'

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
    const id = searchParams.get('id')

    if (id) {
      const building = await getBuildingById(id)
      if (!building) {
        return NextResponse.json({ error: 'Building not found' }, { status: 404 })
      }
      return NextResponse.json({ building })
    }

    const buildings = await getBuildings()
    const formattedBuildings = buildings.map(b => ({
      id: b.id,
      name: b.name,
      address: b.address,
      totalUnits: b.total_units,
      occupiedUnits: 0,
      totalParkingSpots: b.total_parking_spots,
      visitorParkingSpots: b.visitor_parking_spots,
      activeVisitors: 0,
      pendingAlerts: 0,
      monthlyRevenue: 0,
      outstandingBalance: b.outstanding_balance,
      status: 'active' as const,
      lastPaymentDate: b.last_payment_date ? new Date(b.last_payment_date) : undefined,
      subscriptionStatus: b.subscription_status as 'active' | 'past_due' | 'canceled' | 'trialing',
    }))
    return NextResponse.json(formattedBuildings)
  } catch (error) {
    console.error('Error fetching buildings:', error)
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
    console.log('[API/buildings] Creating building:', body)
    
    const buildingData = {
      name: body.name,
      address: body.address || '',
      total_units: body.total_units || 0,
      total_parking_spots: body.total_parking_spots || 0,
      visitor_parking_spots: body.visitor_parking_spots || 0,
      bold_account_id: body.bold_account_id || null,
      monthly_fee: body.monthly_fee || 0,
      currency: body.currency || 'COP',
      outstanding_balance: body.outstanding_balance || 0,
      last_payment_date: body.last_payment_date || null,
      subscription_status: body.subscription_status || 'trialing',
    }
    
    await createBuilding(buildingData)
    console.log('[API/buildings] Building created successfully')
    return NextResponse.json({ success: true, message: 'Building created' }, { status: 201 })
  } catch (error) {
    console.error('[API/buildings] Error creating building:', error)
    return NextResponse.json({ error: 'Failed to create building', details: String(error) }, { status: 500 })
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
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }
    await updateBuilding(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
