import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authRes = await requireAuth(req);
  if (isAuthResponse(authRes)) return authRes;
  const { user } = authRes;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { id } = await params;

  const form = await req.formData();
  const file = form.get('file') as File;
  const change_note = form.get('change_note') as string;

  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 });

  const { data: doc } = await supabase.from('documents').select('building_id').eq('id', id).single();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Mutation by id: assert the document's building matches the caller's building scope
  const access = assertBuildingAccess(user, doc.building_id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const version_number = 1; // simplified
  const path = `buildings/${doc.building_id}/doc_${id}/v${version_number}/${file.name}`;
  
  const { error: uploadError } = await supabase.storage.from('building-documents').upload(path, file);
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await supabase.from('document_versions').insert({
    document_id: id,
    version_number,
    storage_path: path,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: user.id,
    change_note
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
