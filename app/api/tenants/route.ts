import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccessAsync } from '@/lib/auth/assertBuildingAccess'
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} from '@/lib/db/queries/tenants'
import { createUser } from '@/lib/db/queries/users'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/tenants' })

const CreateTenantSchema = z.object({
  building_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Nombre requerido').max(200),
  document_id: z.string().trim().min(1, 'Documento requerido').max(50),
  email: z.string().trim().email('Correo inválido'),
  phone: z.string().trim().min(1, 'Teléfono requerido').max(30),
  unit: z.string().trim().min(1, 'Unidad requerida').max(50),
  lease_start: z.string().min(1, 'Fecha inicio requerida'),
  lease_end: z.string().min(1, 'Fecha fin requerida'),
  monthly_rent: z.coerce.number().min(0),
  deposit_paid: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['active', 'pending', 'ended']).optional().default('active'),
  owner_id: z.string().uuid().optional(),
  owner_name: z.string().trim().max(200).optional(),
  owner_unit: z.string().trim().max(50).optional(),
  send_invite: z.boolean().optional().default(false),
})

const UpdateTenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
  document_id: z.string().trim().min(1).max(50).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  unit: z.string().trim().min(1).max(50).optional(),
  lease_start: z.string().min(1).optional(),
  lease_end: z.string().min(1).optional(),
  monthly_rent: z.coerce.number().min(0).optional(),
  deposit_paid: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'pending', 'ended']).optional(),
})

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin', 'vigilante', 'usuario'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = await assertBuildingAccessAsync(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const ownerFilter = user.role === 'usuario' ? user.id : undefined
    const tenants = await getTenants(buildingId, ownerFilter)
    return NextResponse.json({ tenants })
  } catch (error) {
    log.error({ error }, 'Error fetching tenants')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin', 'usuario'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = CreateTenantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const access = await assertBuildingAccessAsync(user, data.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const isOwnerCaller = user.role === 'usuario'
    const ownerId = isOwnerCaller ? user.id : (data.owner_id ?? user.id)
    const ownerName = isOwnerCaller ? (user.name || user.email) : (data.owner_name || user.name || user.email)
    const ownerUnit = data.owner_unit || data.unit

    const tenantId = await createTenant({
      building_id: data.building_id,
      name: data.name,
      document_id: data.document_id,
      phone: data.phone,
      email: data.email,
      unit: data.unit,
      owner_id: ownerId,
      owner_name: ownerName,
      owner_unit: ownerUnit,
      lease_start: new Date(data.lease_start).toISOString(),
      lease_end: new Date(data.lease_end).toISOString(),
      monthly_rent: Math.round(data.monthly_rent),
      deposit_paid: Math.round(data.deposit_paid),
      status: data.status,
    })

    const admin = getSupabaseAdmin()
    let invitedUserId: string | null = null
    let invitationSent = false

    if (data.send_invite && data.email && admin) {
      try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
          data.email,
          {
            redirectTo: `${origin}/auth/confirm`,
            data: {
              name: data.name,
              role: 'usuario',
              building_id: data.building_id,
              organization_id: user.organization_id ?? null,
            },
          }
        )

        if (!inviteError && inviteData?.user) {
          invitedUserId = inviteData.user.id
          invitationSent = true

          try {
            await createUser({
              id: invitedUserId,
              email: data.email,
              name: data.name,
              role: 'usuario',
              building_id: data.building_id,
              organization_id: user.organization_id ?? null,
              unit: data.unit,
              phone: data.phone || null,
            })
          } catch {
            await admin
              .from('users')
              .update({
                name: data.name,
                role: 'usuario',
                building_id: data.building_id,
                organization_id: user.organization_id ?? null,
                unit: data.unit,
                phone: data.phone || null,
              })
              .eq('id', invitedUserId)
          }

          if (user.organization_id) {
            await admin
              .from('organization_members')
              .upsert(
                {
                  organization_id: user.organization_id,
                  user_id: invitedUserId,
                  role: 'resident',
                  status: 'active',
                  invited_by_user_id: user.id,
                  joined_at: new Date().toISOString(),
                },
                { onConflict: 'organization_id,user_id' }
              )
          }
        } else if (inviteError) {
          log.warn({ error: inviteError, email: data.email }, 'Tenant auth invite skipped or failed')
        }
      } catch (inviteErr) {
        log.warn({ error: inviteErr }, 'Error sending tenant invite')
      }
    }

    if (admin) {
      try {
        const { data: existingResident } = await admin
          .from('residents')
          .select('id')
          .eq('building_id', data.building_id)
          .eq('email', data.email)
          .maybeSingle()

        if (existingResident?.id) {
          await admin
            .from('residents')
            .update({
              is_tenant: true,
              owner_id: ownerId,
              owner_name: ownerName,
              unit: data.unit,
              phone: data.phone,
              lease_end: new Date(data.lease_end).toISOString(),
              ...(invitedUserId ? { user_id: invitedUserId } : {}),
            })
            .eq('id', existingResident.id)
        } else {
          await admin.from('residents').insert({
            id: crypto.randomUUID(),
            building_id: data.building_id,
            user_id: invitedUserId,
            name: data.name,
            unit: data.unit,
            phone: data.phone,
            email: data.email,
            balance: 0,
            is_tenant: true,
            owner_id: ownerId,
            owner_name: ownerName,
            lease_end: new Date(data.lease_end).toISOString(),
          })
        }
      } catch (resErr) {
        log.warn({ error: resErr }, 'Non-critical error syncing tenant to residents')
      }
    }

    return NextResponse.json(
      {
        success: true,
        id: tenantId,
        invitationSent,
        message: invitationSent
          ? 'Inquilino registrado e invitación enviada'
          : 'Inquilino registrado exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    log.error({ error }, 'Error creating tenant')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin', 'usuario'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = UpdateTenantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, ...updates } = parsed.data
    const existing = await getTenantById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const access = await assertBuildingAccessAsync(user, existing.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    if (user.role === 'usuario' && existing.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: you can only modify your own tenants' },
        { status: 403 }
      )
    }

    await updateTenant(id, {
      ...updates,
      ...(updates.lease_start ? { lease_start: new Date(updates.lease_start).toISOString() } : {}),
      ...(updates.lease_end ? { lease_end: new Date(updates.lease_end).toISOString() } : {}),
      ...(updates.monthly_rent !== undefined ? { monthly_rent: Math.round(updates.monthly_rent) } : {}),
      ...(updates.deposit_paid !== undefined ? { deposit_paid: Math.round(updates.deposit_paid) } : {}),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error updating tenant')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin', 'usuario'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const existing = await getTenantById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const access = await assertBuildingAccessAsync(user, existing.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    if (user.role === 'usuario' && existing.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: you can only delete your own tenants' },
        { status: 403 }
      )
    }

    await deleteTenant(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error deleting tenant')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
