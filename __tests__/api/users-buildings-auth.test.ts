/**
 * T-049 negative authorization tests — POST /api/buildings and POST /api/users.
 *
 * Escalation scenarios from the findings register (N4, N5):
 *   N4: any authenticated user could create a building and self-promote to admin.
 *   N5: a building-less resident could provision an admin into any building.
 *
 * Boundary mocks: requireAuth (session), db/queries (persistence), db/supabase
 * (Auth admin API). We assert the authorization gate BEFORE any write happens.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// ─── Mocks (must be hoisted before imports) ────────────────────────────────

// Auth/session boundary
const mockRequireAuth = vi.fn()
vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

// DB persistence boundary
const mockCreateBuilding = vi.fn()
const mockCreateUser = vi.fn()
const mockUpdateUser = vi.fn()
vi.mock('@/lib/db/queries/buildings', () => ({
  createBuilding: (...args: unknown[]) => mockCreateBuilding(...args),
  getBuildings: vi.fn(),
  getBuildingById: vi.fn(),
}))
vi.mock('@/lib/db/queries/users', () => ({
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  deleteUser: vi.fn(),
}))

// Supabase Auth admin API boundary
const mockAdminCreateUser = vi.fn()
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        createUser: mockAdminCreateUser,
        deleteUser: vi.fn(),
      },
    },
  }),
}))

// Logger (avoid noise in test output)
vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) },
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

/** A session user profile as requireAuth returns it. */
function sessionUser(overrides: Partial<{
  id: string; role: string; building_id: string | null
}> = {}) {
  return {
    id: overrides.id ?? '00000000-0000-4000-8000-000000000001',
    email: 'caller@test.local',
    name: 'Caller',
    role: overrides.role ?? 'usuario',
    building_id: overrides.building_id ?? null,
  }
}

function buildingId() {
  return '11111111-1111-4111-8111-111111111111'
}
function otherBuildingId() {
  return '22222222-2222-4222-8222-222222222222'
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Mock a successful authenticated session. */
function authAs(user: ReturnType<typeof sessionUser>) {
  mockRequireAuth.mockResolvedValue({ user, supabaseId: user.id })
}

const validUserBody = {
  name: 'Target User',
  email: 'target@test.local',
  role: 'usuario',
  building_id: buildingId(),
}

const validBuildingBody = {
  name: 'Test Tower',
  address: 'Calle 100 #1-1',
  total_units: 50,
  total_parking_spots: 20,
  visitor_parking_spots: 5,
}

// ─── Tests: POST /api/buildings (N4) ────────────────────────────────────────

describe('POST /api/buildings — N4 escalation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests (401)', async () => {
    mockRequireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const { POST } = await import('@/app/api/buildings/route')
    const res = await POST(jsonRequest(validBuildingBody))
    expect(res.status).toBe(401)
    expect(mockCreateBuilding).not.toHaveBeenCalled()
  })

  it('rejects a resident (usuario) creating a building (403)', async () => {
    authAs(sessionUser({ role: 'usuario', building_id: buildingId() }))
    const { POST } = await import('@/app/api/buildings/route')
    const res = await POST(jsonRequest(validBuildingBody))
    expect(res.status).toBe(403)
    expect(mockCreateBuilding).not.toHaveBeenCalled()
    expect(mockUpdateUser).not.toHaveBeenCalled() // no self-promotion
  })

  it('rejects an admin creating a building (403)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/buildings/route')
    const res = await POST(jsonRequest(validBuildingBody))
    expect(res.status).toBe(403)
    expect(mockCreateBuilding).not.toHaveBeenCalled()
  })

  it('rejects a vigilante creating a building (403)', async () => {
    authAs(sessionUser({ role: 'vigilante', building_id: buildingId() }))
    const { POST } = await import('@/app/api/buildings/route')
    const res = await POST(jsonRequest(validBuildingBody))
    expect(res.status).toBe(403)
    expect(mockCreateBuilding).not.toHaveBeenCalled()
  })

  it('allows super_admin and does NOT self-promote (N4 core)', async () => {
    authAs(sessionUser({ role: 'super_admin' }))
    mockCreateBuilding.mockResolvedValue(buildingId())
    const { POST } = await import('@/app/api/buildings/route')
    const res = await POST(jsonRequest(validBuildingBody))
    expect(res.status).toBe(201)
    expect(mockCreateBuilding).toHaveBeenCalledTimes(1)
    // THE regression test for N4: updateUser must never be called (no role change)
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})

// ─── Tests: POST /api/users (N5) ────────────────────────────────────────────

describe('POST /api/users — N5 escalation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: '99999999-9999-4999-8999-999999999999' } },
      error: null,
    })
  })

  it('rejects unauthenticated requests (401)', async () => {
    mockRequireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest(validUserBody))
    expect(res.status).toBe(401)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('rejects a resident (usuario) creating ANY user, even role usuario (403)', async () => {
    authAs(sessionUser({ role: 'usuario', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'usuario' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('rejects a resident attempting to create an admin (403)', async () => {
    authAs(sessionUser({ role: 'usuario', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'admin' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it('rejects a building-less resident creating an admin in any building (N5 core)', async () => {
    authAs(sessionUser({ role: 'usuario', building_id: null }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'admin' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('rejects a building-less resident with building_id OMITTED (403, not 400)', async () => {
    authAs(sessionUser({ role: 'usuario', building_id: null }))
    const { POST } = await import('@/app/api/users/route')
    const { building_id: _omit, ...noBuilding } = validUserBody
    const res = await POST(jsonRequest({ ...noBuilding, role: 'admin' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it('rejects an admin creating another admin (403)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'admin', building_id: buildingId() }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it('rejects an admin creating a vigilante (403)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'vigilante', building_id: buildingId() }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it('rejects an admin creating a super_admin (403)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'super_admin' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it('rejects an admin operating OUTSIDE their building (building mismatch, 403)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    // Client sends OTHER building's id — must be rejected even for role usuario
    const res = await POST(jsonRequest({
      ...validUserBody,
      role: 'usuario',
      building_id: otherBuildingId(),
    }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('rejects an admin with building_id OMITTED (falls back to caller building, 201)', async () => {
    authAs(sessionUser({ role: 'admin', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const { building_id: _omit, ...noBuilding } = validUserBody
    const res = await POST(jsonRequest({ ...noBuilding, role: 'usuario' }))
    // OK: admin creates resident in their own building (server derives it)
    expect(res.status).toBe(201)
    expect(mockAdminCreateUser).toHaveBeenCalledTimes(1)
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ building_id: buildingId(), role: 'usuario' })
    )
  })

  it('allows super_admin to create an admin and returns tempPassword (201)', async () => {
    authAs(sessionUser({ role: 'super_admin' }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'admin' }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.tempPassword).toBeTruthy()
    expect(data.tempPassword).toHaveLength(9)
    expect(mockAdminCreateUser).toHaveBeenCalledTimes(1)
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', building_id: buildingId() })
    )
  })

  it('rejects a vigilante creating any user (403)', async () => {
    authAs(sessionUser({ role: 'vigilante', building_id: buildingId() }))
    const { POST } = await import('@/app/api/users/route')
    const res = await POST(jsonRequest({ ...validUserBody, role: 'usuario' }))
    expect(res.status).toBe(403)
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })
})
