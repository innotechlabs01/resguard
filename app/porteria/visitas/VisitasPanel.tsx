'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VisitasPanel() {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [buildingId, setBuildingId] = useState('');

  async function load() {
    if (!buildingId) return;
    const { data } = await supabase.from('visitors').select('*').eq('building_id', buildingId).order('created_at', { ascending: false });
    setVisitas(data || []);
  }

  async function aprobar(id: string) {
    await supabase.from('visitors').update({ status: 'aprobado' }).eq('id', id);
    load();
  }

  return (
    <div className="space-y-4">
      <input placeholder="Building ID" value={buildingId} onChange={e=>setBuildingId(e.target.value)} className="border p-2 rounded" />
      <button onClick={load} className="bg-gray-800 text-white p-2 rounded">Cargar</button>
      <ul className="space-y-2">
        {visitas.map(v => (
          <li key={v.id} className="border p-3 rounded flex justify-between">
            <div>
              <p className="font-semibold">{v.name} → {v.destination_unit}</p>
              <p className="text-sm text-gray-600">Residente: {v.resident_name} | Estado: {v.status}</p>
            </div>
            <button onClick={()=>aprobar(v.id)} className="bg-green-600 text-white px-3 rounded">Aprobar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
