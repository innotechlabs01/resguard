import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  building_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional()
});

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { building_id, category_id, title, description } = parsed.data;
  const { data, error } = await supabase.from('documents').insert({
    building_id,
    category_id,
    title,
    description,
    created_by: user.id
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
