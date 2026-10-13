import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'
import { validateBody, CreateUserSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/users' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { user } = authRes

    // If user has no building_id and is not super_admin, deny global scope
    if (user.role !== 'super_admin' && !user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
    }

    const users = await getUsers(user.role === 'super_admin' ? undefined : user.building_id!)
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
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const validation = validateBody(CreateUserSchema, body)
    if (!validation.success) return validation.response

    const targetRole = validation.data.role
    const targetBuildingId = validation.data.building_id || null

    if (caller.role !== 'super_admin' && targetRole === 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: cannot create super_admin' }, { status: 403 })
    }
    if (caller.role !== 'super_admin' && caller.building_id) {
      if (targetBuildingId && targetBuildingId !== caller.building_id) {
        return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
      }
    }
    if (caller.role !== 'super_admin' && !targetBuildingId) {
      return NextResponse.json({ error: 'building_id required' }, { status: 400 })
    }

    await createUser({
      id: crypto.randomUUID(),
      email: validation.data.email,
      name: validation.data.name,
      role: targetRole,
      building_id: targetBuildingId ?? caller.building_id,
    })
    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating user')
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const { id, role, building_id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (caller.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const filtered: Record<string, unknown> = { ...updates }
    if (role !== undefined) filtered.role = role
    if (building_id !== undefined) filtered.building_id = building_id

    await updateUser(id, filtered)
    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating user')
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    if (caller.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
