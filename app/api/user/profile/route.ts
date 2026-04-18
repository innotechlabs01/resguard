import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/db/queries/users'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User ID:', userId);

    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found in database. Please contact administrator.' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
