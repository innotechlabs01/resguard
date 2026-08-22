import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getIntercomUnits, getIntercomCalls, createIntercomCall, respondToCall } from '@/lib/db/queries/intercom'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/intercom' })

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

// Send push notification to resident via Expo Push Service
async function sendPushToResident(unitNumber: string, callerType: string, callerName: string | null) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  try {
    // Find device tokens for this unit's resident
    // The resident's user_id is stored in device_tokens with role='resident'
    // We need to match by unit — query users table for the unit, then get their device tokens
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('unit', unitNumber)
      .limit(1)

    if (!users || users.length === 0) return

    const userId = users[0].id

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!tokens || tokens.length === 0) return

    const typeLabel = callerType === 'visitor' ? 'Visitante'
      : callerType === 'delivery' ? 'Domicilio'
      : 'Otro'

    // Send to Expo Push Service
    const messages = tokens.map(t => ({
      to: t.token,
      title: '🔔 Llamada del Citofono',
      body: `${typeLabel}${callerName ? ` - ${callerName}` : ''} en portería`,
      data: { type: 'intercom_call', unitNumber, callerType, callerName },
      sound: 'default',
      priority: 'high',
    }))

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    log.info({ unitNumber, callerType, tokensCount: tokens.length }, 'Push notification sent to resident')
  } catch (error) {
    log.error({ error, unitNumber }, 'Failed to send push notification')
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

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
    log.error({ error }, 'Error fetching intercom data')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

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

    // Send push notification to the specific resident
    sendPushToResident(unitNumber, callerType, callerName).catch(err =>
      log.error({ err }, 'Push notification failed')
    )

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
    log.error({ error }, 'Error processing intercom action')
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
