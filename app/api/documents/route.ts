import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth';
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

const schema = z.object({
  building_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req)
    if (isAuthResponse(authResult)) return authResult

    const { user } = authResult

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { building_id, category_id, title, description } = parsed.data
    const access = assertBuildingAccess(user, building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const { data, error } = await supabase.from('documents').insert({
      building_id,
      category_id,
      title,
      description,
      created_by: user.id
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
