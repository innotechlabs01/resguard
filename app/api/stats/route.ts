import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSystemStats } from '@/lib/db/queries/stats'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getSystemStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
