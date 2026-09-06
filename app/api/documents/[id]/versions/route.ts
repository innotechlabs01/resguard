import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File;
  const change_note = form.get('change_note') as string;

  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 });

  const { data: doc } = await supabase.from('documents').select('building_id').eq('id', params.id).single();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const version_number = 1; // simplified
  const path = `buildings/${doc.building_id}/doc_${params.id}/v${version_number}/${file.name}`;
  
  const { error: uploadError } = await supabase.storage.from('building-documents').upload(path, file);
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await supabase.from('document_versions').insert({
    document_id: params.id,
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
