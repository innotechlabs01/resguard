import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getIntercomUnits, getIntercomCalls, createIntercomCall, respondToCall } from '@/lib/db/queries/intercom'
import { getSupabaseAdmin } from '@/lib/db/supabase'

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())
const POLL_INTERVAL_MS = 3000

interface IntercomEvent {
  id: string
  type: 'new-call' | 'call-response'
  buildingId: string
  unitNumber: string
  callerType?: string
  callerName?: string
  callerMessage?: string
  status?: string
  response?: string
  timestamp: number
}

const eventStore = new Map<string, IntercomEvent[]>()

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
    const buildingId = searchParams.get('buildingId')
    const type = searchParams.get('type')
    const unitId = searchParams.get('unitId')
    const lastTimestamp = searchParams.get('lastTimestamp')

    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    if (type === 'poll') {
      const events = eventStore.get(buildingId) || []
      const clientLastTime = lastTimestamp ? parseInt(lastTimestamp) : 0
      
      const newEvents = events.filter(e => e.timestamp > clientLastTime)
      
      const calls = await getIntercomCalls(buildingId, 50)
      
      return NextResponse.json({
        events: newEvents,
        calls,
        timestamp: Date.now(),
        pollingInterval: POLL_INTERVAL_MS,
      })
    }

    if (type === 'calls') {
      const calls = await getIntercomCalls(buildingId)
      return NextResponse.json({ calls })
    }

    if (unitId) {
      const units = await getIntercomUnits(buildingId)
      const unit = units.find(u => u.id === unitId)
      return NextResponse.json({ unit })
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
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { buildingId, unitId, unitNumber, callerType, callerName, callerMessage, callId, response, note } = body

    if (callId && response) {
      await respondToCall(callId, response, note)
      
      const event: IntercomEvent = {
        id: callId,
        type: 'call-response',
        buildingId,
        unitNumber: unitNumber || '',
        status: response,
        timestamp: Date.now(),
      }
      
      addEvent(buildingId, event)
      
      const supabase = getSupabaseAdmin()
      if (supabase) {
        try {
          await supabase.from('intercom_calls').update({ responded_at: new Date().toISOString() }).eq('id', callId)
        } catch (e) {}
      }
      
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

    const event: IntercomEvent = {
      id,
      type: 'new-call',
      buildingId,
      unitNumber,
      callerType,
      callerName,
      callerMessage,
      status: 'pending',
      timestamp: Date.now(),
    }
    
    addEvent(buildingId, event)

    return NextResponse.json({ 
      id, 
      message: 'Call initiated',
      polling: true,
    })
  } catch (error) {
    console.error('Error processing intercom action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function addEvent(buildingId: string, event: IntercomEvent) {
  const events = eventStore.get(buildingId) || []
  events.unshift(event)
  
  const cutoff = Date.now() - 60000
  const filtered = events.filter(e => e.timestamp > cutoff)
  
  eventStore.set(buildingId, filtered)
}
