import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'
import { validateBody, CreateUserSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())
const log = logger.child({ module: 'api/users' })

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
    log.error({ error }, 'Error fetching users')
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
    const validation = validateBody(CreateUserSchema, body)
    if (!validation.success) return validation.response

    await createUser({
      clerk_user_id: validation.data.clerk_user_id,
      email: validation.data.email,
      name: validation.data.name,
      role: validation.data.role,
      building_id: validation.data.building_id || null,
    })
    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating user')
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
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
    log.error({ error }, 'Error updating user')
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
    log.error({ error }, 'Error deleting user')
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
