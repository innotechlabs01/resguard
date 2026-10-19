import { NextResponse } from 'next/server'
import { listActivePlans } from '@/lib/billing/subscriptions'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/plans' })

/**
 * GET /api/plans — Catálogo público de planes.
 */
export async function GET() {
  try {
    const plans = await listActivePlans()
    return NextResponse.json({ plans })
  } catch (error) {
    log.error({ error }, 'Error listando planes')
    return NextResponse.json({ error: 'Error al listar planes' }, { status: 500 })
  }
}
