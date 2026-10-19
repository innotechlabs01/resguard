'use client'

import { useEffect, useState } from 'react'
import DocumentList from '@/components/secretaria/DocumentList'
import DocumentForm from '@/components/secretaria/DocumentForm'
import { useAuth } from '@/lib/auth-context'

export default function SecretariaPage() {
  const { user, isLoaded } = useAuth()
  const [buildingId, setBuildingId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user?.buildingId) {
      setBuildingId(user.buildingId)
    }
  }, [isLoaded, user?.buildingId])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!buildingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Secretaría Documental</h1>
          <p className="text-muted-foreground">
            No tienes un edificio asignado. Contacta al administrador para obtener acceso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Secretaría Documental</h1>
      <DocumentForm buildingId={buildingId} />
      <DocumentList buildingId={buildingId} />
    </div>
  )
}
