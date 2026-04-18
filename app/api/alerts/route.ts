import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAlerts, createAlert, updateAlert, deleteAlert } from '@/lib/db/queries/alerts'

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
    const buildingId = searchParams.get('buildingId') ?? undefined

    const alerts = await getAlerts(buildingId)
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
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
    
    const alertData = {
      building_id: body.building_id,
      type: body.type,
      title: body.title,
      message: body.message,
      priority: body.priority || 'medium',
      read: body.read || false,
      action_required: body.action_required || false,
      related_id: body.related_id || null,
    }

    await createAlert(alertData)
    return NextResponse.json({ success: true, message: 'Alert created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert', details: String(error) }, { status: 500 })
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
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    await updateAlert(id, updates)
    return NextResponse.json({ success: true, message: 'Alert updated successfully' })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    await deleteAlert(id)
    return NextResponse.json({ success: true, message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
