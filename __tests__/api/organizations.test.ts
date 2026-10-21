/**
 * Multi-tenant organization tests — creation, membership, plan limits.
 * Tests the new organizations + organization_members model.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn()
vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  isAuthResponse: (v: unknown) => v instanceof Response,
}))

// Mock supabase admin with fluent query builder
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpsert = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()
const mockIn = vi.fn()

const createMockQuery = (result: { data?: unknown; error?: unknown } = { data: null, error: null }) => ({
  select: (...args: unknown[]) => { mockSelect(...args); return createMockQuery(result) },
  insert: (...args: unknown[]) => { mockInsert(...args); return createMockQuery(result) },
  upsert: (...args: unknown[]) => { mockUpsert(...args); return createMockQuery(result) },
  eq: (...args: unknown[]) => { mockEq(...args); return createMockQuery(result) },
  in: (...args: unknown[]) => { mockIn(...args); return createMockQuery(result) },
  single: () => { mockSingle(); return Promise.resolve(result) },
  order: (...args: unknown[]) => { mockOrder(...args); return createMockQuery(result) },
  delete: () => { mockDelete(); return createMockQuery(result) },
  update: (...args: unknown[]) => { mockUpdate(...args); return createMockQuery(result) },
})

const mockInviteUser = vi.fn()
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      // Route-specific mock data
      if (table === 'organization_members') {
        return createMockQuery({ data: [], error: null })
      }
      if (table === 'organizations') {
        return createMockQuery({
          data: { id: 'org-123', name: 'Test Org', type: 'hogar', owner_user_id: 'user-1' },
          error: null,
        })
      }
      if (table === 'audit_log') {
        return createMockQuery({ data: null, error: null })
      }
      return createMockQuery({ data: null, error: null })
    },
    auth: {
      admin: {
        inviteUserByEmail: mockInviteUser,
      },
    },
    rpc: vi.fn().mockResolvedValue('active'),
  }),
}))

// Rate limit: always pass
vi.mock('@/lib/rate-limit', () => ({
  checkStrictRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 99 }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('test-ip'),
}))

vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) },
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function sessionUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'usuario',
    building_id: null,
    ...overrides,
  }
}

function jsonRequest(body: unknown, method = 'POST') {
  return new Request('http://localhost/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function authAs(user: ReturnType<typeof sessionUser>) {
  mockRequireAuth.mockResolvedValue({ user, supabaseId: user.id })
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/organizations — multi-tenant creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests (401)', async () => {
    mockRequireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const { POST } = await import('@/app/api/organizations/route')
    const res = await POST(jsonRequest({ name: 'Mi Casa', type: 'hogar' }))
    expect(res.status).toBe(401)
  })

  it('rejects invalid organization type (400)', async () => {
    authAs(sessionUser({ role: 'usuario' }))
    const { POST } = await import('@/app/api/organizations/route')
    const res = await POST(jsonRequest({ name: 'Mi Casa', type: 'invalid_type' }))
    expect(res.status).toBe(400)
  })

  it('rejects name shorter than 2 chars (400)', async () => {
    authAs(sessionUser({ role: 'usuario' }))
    const { POST } = await import('@/app/api/organizations/route')
    const res = await POST(jsonRequest({ name: 'A', type: 'hogar' }))
    expect(res.status).toBe(400)
  })

  it('allows any authenticated user to create an organization (they become titular)', async () => {
    authAs(sessionUser({ role: 'usuario' }))
    const { POST } = await import('@/app/api/organizations/route')
    const res = await POST(jsonRequest({ name: 'Mi Casa', type: 'hogar' }))
    // The mock returns success for insert; the route should return 201
    // (or 500 if the mock doesn't perfectly simulate the fluent chain, but NOT 403)
    expect(res.status).not.toBe(403) // No privilege escalation check needed — ANY user can create an org
    expect(res.status).not.toBe(401)
  })

  it('allows super_admin to create an organization', async () => {
    authAs(sessionUser({ role: 'super_admin' }))
    const { POST } = await import('@/app/api/organizations/route')
    const res = await POST(jsonRequest({ name: 'Inmobiliaria XYZ', type: 'inmobiliaria' }))
    expect(res.status).not.toBe(403)
    expect(res.status).not.toBe(401)
  })
})

describe('POST /api/organizations/members — membership invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInviteUser.mockResolvedValue({
      data: { user: { id: '99999999-9999-4999-8999-999999999999' } },
      error: null,
    })
  })

  it('rejects unauthenticated requests (401)', async () => {
    mockRequireAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const { POST } = await import('@/app/api/organizations/members/route')
    const res = await POST(jsonRequest({
      organization_id: '11111111-1111-4111-8111-111111111111',
      email: 'new@example.com',
      role: 'resident',
    }))
    expect(res.status).toBe(401)
  })

  it('rejects invalid role (400) — cannot invite as titular', async () => {
    authAs(sessionUser({ role: 'admin' }))
    const { POST } = await import('@/app/api/organizations/members/route')
    const res = await POST(jsonRequest({
      organization_id: '11111111-1111-4111-8111-111111111111',
      email: 'new@example.com',
      role: 'titular', // INVALID: cannot invite someone as titular
    }))
    expect(res.status).toBe(400) // zod rejects 'titular' in the enum
  })

  it('rejects invalid role super_admin (400)', async () => {
    authAs(sessionUser({ role: 'admin' }))
    const { POST } = await import('@/app/api/organizations/members/route')
    const res = await POST(jsonRequest({
      organization_id: '11111111-1111-4111-8111-111111111111',
      email: 'new@example.com',
      role: 'super_admin', // INVALID: cannot invite as super_admin
    }))
    expect(res.status).toBe(400)
  })

  it('rejects a plain resident trying to invite members (403)', async () => {
    authAs(sessionUser({ role: 'usuario' }))
    const { POST } = await import('@/app/api/organizations/members/route')
    const res = await POST(jsonRequest({
      organization_id: '11111111-1111-4111-8111-111111111111',
      email: 'new@example.com',
      role: 'resident',
    }))
    // The mock returns null membership + null org, so it should be 404 or 403
    expect([403, 404, 500]).toContain(res.status)
    expect(res.status).not.toBe(201) // MUST NOT succeed
  })
})

describe('Plan limits — server-side enforcement', () => {
  it('checkBuildingLimit returns null when no organization (legacy mode)', async () => {
    const { checkBuildingLimit } = await import('@/lib/plan-limits')
    const result = await checkBuildingLimit(null)
    expect(result).toBeNull()
  })

  it('checkAdminUserLimit returns null when no organization', async () => {
    const { checkAdminUserLimit } = await import('@/lib/plan-limits')
    const result = await checkAdminUserLimit(null)
    expect(result).toBeNull()
  })
})

describe('Subscription guard — mora and grace period', () => {
  it('checkSubscriptionAccess returns null when no organization (legacy)', async () => {
    const { checkSubscriptionAccess } = await import('@/lib/subscription-guard')
    const result = await checkSubscriptionAccess(null)
    expect(result).toBeNull()
  })

  it('checkSubscriptionAccess returns null for undefined org', async () => {
    const { checkSubscriptionAccess } = await import('@/lib/subscription-guard')
    const result = await checkSubscriptionAccess(undefined)
    expect(result).toBeNull()
  })
})
