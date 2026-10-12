import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth';
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess';
import { z } from 'zod';

const schema = z.object({
  version_id: z.string().uuid(),
  status: z.enum(['approved','rejected']),
  signature_note: z.string().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authRes = await requireAuth(req);
  if (isAuthResponse(authRes)) return authRes;
  const { user } = authRes;

  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { version_id, status, signature_note } = parsed.data;

  // Mutation by id: read the document's building → assert access → mutate
  const { data: doc } = await supabase.from('documents').select('building_id').eq('id', id).single();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const access = assertBuildingAccess(user, doc.building_id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data, error } = await supabase.from('document_signatures').insert({
    document_id: id,
    version_id,
    signed_by: user.id,
    status,
    signature_note
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
