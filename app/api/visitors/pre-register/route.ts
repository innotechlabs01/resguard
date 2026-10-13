import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await req.json()
    const { building_id, name, document_id, document_photo, type, vehicle_plate, vehicle_photo, destination_unit, resident_name, phone } = body

    if (!building_id || !name || !document_id || !destination_unit || !resident_name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    if (user.role !== 'super_admin' && user.building_id !== building_id) {
      return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data, error } = await supabase.from('visitors').insert({
      building_id,
      name,
      document_id,
      document_photo: document_photo || null,
      type: type || 'visitante',
      vehicle_plate: vehicle_plate || null,
      vehicle_photo: vehicle_photo || null,
      destination_unit,
      resident_name,
      status: 'pendiente',
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, visitor: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
