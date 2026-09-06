'use client';
import { useState } from 'react';

export default function DocumentForm({ buildingId }: { buildingId: string }) {
  const [title, setTitle] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/documents', { method: 'POST', body: JSON.stringify({ building_id: buildingId, title }) });
    setTitle('');
  };
  return (
    <form onSubmit={submit}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título documento" />
      <button type="submit">Crear</button>
    </form>
  );
}
