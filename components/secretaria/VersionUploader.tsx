'use client';
import { useState } from 'react';

export default function VersionUploader({ documentId }: { documentId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`/api/documents/${documentId}/versions`, { method: 'POST', body: fd });
  };
  return (
    <div>
      <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
      <button onClick={upload}>Subir versión</button>
    </div>
  );
}
