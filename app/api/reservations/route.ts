import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/reservations' })

export const dynamic = 'force-dynamic'

const CreateReservationSchema = z.object({
  area_id: z.string().uuid(),
  building_id: z.string().uuid(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  notes: z.string().max(500).optional(),
})

const UpdateReservationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
})

/**
 * GET /api/reservations?buildingId=<uuid>
 * Returns common areas + reservations for the building.
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'vigilante', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const [areasResult, reservationsResult] = await Promise.all([
      admin.from('common_areas')
        .select('*')
        .eq('building_id', buildingId)
        .eq('is_active', true)
        .order('name'),
      admin.from('area_reservations')
        .select('*')
        .eq('building_id', buildingId)
        .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true })
        .limit(100),
    ])

    if (areasResult.error) {
      log.error({ error: areasResult.error }, 'Error fetching common areas')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    if (reservationsResult.error) {
      log.error({ error: reservationsResult.error }, 'Error fetching reservations')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      areas: areasResult.data || [],
      reservations: reservationsResult.data || [],
    })
  } catch (error) {
    log.error({ error }, 'Error in GET /api/reservations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/reservations — create a reservation (residents).
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = CreateReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const access = assertBuildingAccess(user, parsed.data.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    // Validate time range
    const start = new Date(parsed.data.start_time)
    const end = new Date(parsed.data.end_time)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ error: 'Rango de tiempo inválido' }, { status: 400 })
    }
    if (start < new Date()) {
      return NextResponse.json({ error: 'No se puede reservar en el pasado' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify the area exists and belongs to the building
    const { data: area, error: areaError } = await admin
      .from('common_areas')
      .select('id, max_duration_hours, advance_notice_hours')
      .eq('id', parsed.data.area_id)
      .eq('building_id', parsed.data.building_id)
      .eq('is_active', true)
      .single()

    if (areaError || !area) {
      return NextResponse.json({ error: 'Zona común no encontrada' }, { status: 404 })
    }

    // Check max duration
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    if (area.max_duration_hours && durationHours > area.max_duration_hours) {
      return NextResponse.json(
        { error: `Duración máxima: ${area.max_duration_hours} horas` },
        { status: 400 }
      )
    }

    const { data: reservation, error: insertError } = await admin
      .from('area_reservations')
      .insert({
        area_id: parsed.data.area_id,
        building_id: parsed.data.building_id,
        user_id: user.id,
        user_name: user.name || user.email,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        notes: parsed.data.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23P01') {
        return NextResponse.json(
          { error: 'Ese horario ya está reservado' },
          { status: 409 }
        )
      }
      log.error({ error: insertError }, 'Error creating reservation')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error in POST /api/reservations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/reservations — update status (confirm/cancel; admin or owner).
 */
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const parsed = UpdateReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Fetch the reservation to check ownership
    const { data: existing, error: fetchError } = await admin
      .from('area_reservations')
      .select('*')
      .eq('id', parsed.data.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    // Authorization: owner can cancel; admin can confirm/cancel; super_admin all
    const isOwner = existing.user_id === user.id
    const isBuildingAdmin = user.role === 'admin' && existing.building_id === user.building_id
    const isSuperAdmin = user.role === 'super_admin'

    if (!isOwner && !isBuildingAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admin can confirm; owner can only cancel their own
    if (parsed.data.status === 'confirmed' && !isBuildingAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Solo el admin puede confirmar' }, { status: 403 })
    }

    const { data: updated, error: updateError } = await admin
      .from('area_reservations')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id)
      .select()
      .single()

    if (updateError) {
      log.error({ error: updateError }, 'Error updating reservation')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ reservation: updated })
  } catch (error) {
    log.error({ error }, 'Error in PATCH /api/reservations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/reservations?id=<uuid> — cancel a reservation (owner or admin).
 */
export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: existing, error: fetchError } = await admin
      .from('area_reservations')
      .select('user_id, building_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    const isOwner = existing.user_id === user.id
    const isBuildingAdmin = user.role === 'admin' && existing.building_id === user.building_id
    const isSuperAdmin = user.role === 'super_admin'

    if (!isOwner && !isBuildingAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await admin
      .from('area_reservations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      log.error({ error: deleteError }, 'Error deleting reservation')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error in DELETE /api/reservations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
