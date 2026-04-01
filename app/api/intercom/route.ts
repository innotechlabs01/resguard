import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getIntercomUnits, getIntercomCalls, createIntercomCall, respondToCall } from '@/lib/db/queries/intercom'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const type = searchParams.get('type')

    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    if (type === 'calls') {
      const calls = await getIntercomCalls(buildingId)
      return NextResponse.json({ calls })
    }

    const units = await getIntercomUnits(buildingId)
    return NextResponse.json({ units })
  } catch (error) {
    console.error('Error fetching intercom data:', error)
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
    const { buildingId, unitId, unitNumber, callerType, callerName, callerMessage, callId, response, note } = body

    if (callId && response) {
      await respondToCall(callId, response, note)
      return NextResponse.json({ message: 'Call response recorded' })
    }

    if (!buildingId || !unitId || !unitNumber || !callerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = await createIntercomCall({
      building_id: buildingId,
      unit_id: unitId,
      unit_number: unitNumber,
      caller_type: callerType,
      caller_name: callerName,
      caller_message: callerMessage,
    })

    return NextResponse.json({ id, message: 'Call initiated' })
  } catch (error) {
    console.error('Error processing intercom action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}