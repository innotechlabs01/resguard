'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DocumentList({ buildingId }: { buildingId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.from('documents').select('*').eq('building_id', buildingId).then(({ data }) => setDocs(data || []));
  }, [buildingId]);

  return (
    <ul>
      {docs.map(d => <li key={d.id}>{d.title}</li>)}
    </ul>
  );
}
