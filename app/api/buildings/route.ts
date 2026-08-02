import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { validateBody, CreateBuildingSchema } from '@/lib/validation'

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())
const log = logger.child({ module: 'api/buildings' })

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
    const buildingId = searchParams.get('id')

    return NextResponse.json({ buildings: [] })
  } catch (error) {
    log.error({ error }, 'Error fetching buildings')
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
    const validation = validateBody(CreateBuildingSchema, body)
    if (!validation.success) return validation.response

    return NextResponse.json({ success: true, message: 'Building created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating building')
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
