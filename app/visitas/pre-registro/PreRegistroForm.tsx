'use client';
import { useState } from 'react';

export default function PreRegistroForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      building_id: form.get('building_id'),
      name: form.get('name'),
      document_id: form.get('document_id'),
      type: form.get('type'),
      vehicle_plate: form.get('vehicle_plate') || '',
      destination_unit: form.get('destination_unit'),
      resident_name: form.get('resident_name'),
    };
    const res = await fetch('/api/visitors/pre-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg('Registro creado. Espera aprobación en portería.');
      e.currentTarget.reset();
    } else {
      setMsg(data.error || 'Error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="building_id" placeholder="ID Edificio (UUID)" required className="w-full border rounded p-2" />
      <input name="name" placeholder="Nombre completo" required className="w-full border rounded p-2" />
      <input name="document_id" placeholder="Documento" required className="w-full border rounded p-2" />
      <select name="type" className="w-full border rounded p-2">
        <option>visitante</option>
        <option>proveedor</option>
        <option>servicio</option>
      </select>
      <input name="vehicle_plate" placeholder="Placa vehículo opcional" className="w-full border rounded p-2" />
      <input name="destination_unit" placeholder="Unidad destino" required className="w-full border rounded p-2" />
      <input name="resident_name" placeholder="Nombre residente" required className="w-full border rounded p-2" />
      <button disabled={loading} className="w-full bg-blue-600 text-white rounded p-2">{loading ? 'Enviando...' : 'Pre-registrar'}</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
