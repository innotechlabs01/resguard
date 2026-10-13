'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DocumentList({ buildingId }: { buildingId: string }) {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('documents').select('*').eq('building_id', buildingId).then(({ data }: { data: any[] | null }) => setDocs(data || []));
  }, [buildingId]);

  return (
    <ul>
      {docs.map(d => <li key={d.id}>{d.title}</li>)}
    </ul>
  );
}
