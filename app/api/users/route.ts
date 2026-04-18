import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const users = await getUsers()
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      buildingId: u.building_id,
    }))
    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (hasClerk) {
      const { userId: clerkUserId } = await auth()
      if (!clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    
    const userData = {
      clerk_user_id: body.clerk_user_id || null,
      email: body.email,
      name: body.name,
      role: body.role,
      building_id: body.building_id || null,
    }

    await createUser(userData)
    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user', details: String(error) }, { status: 500 })
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
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await updateUser(id, updates)
    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
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
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await deleteUser(id)
    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
