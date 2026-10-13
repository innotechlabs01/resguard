import { Suspense } from 'react';
import PreRegistroForm from './PreRegistroForm';

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Pre-registro de visitante</h1>
        <Suspense fallback={<div>Cargando...</div>}>
          <PreRegistroForm />
        </Suspense>
      </div>
    </main>
  );
}
