import { useState, useCallback } from 'react'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (body?: Record<string, unknown>) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: UseApiOptions<T>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (body?: Record<string, unknown>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Request failed')
      }

      setData(result as T)
      options?.onSuccess?.(result as T)
      return result as T
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [url, method, options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

export function useBuildingApi() {
  const createBuilding = useCallback(async (building: {
    name: string
    address: string
    total_units: number
    total_parking_spots: number
    visitor_parking_spots: number
    monthly_fee: number
    currency?: string
  }) => {
    const response = await fetch('/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(building),
    })
    return response.json()
  }, [])

  const updateBuilding = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/buildings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createBuilding, updateBuilding }
}

export function useVisitorApi() {
  const createVisitor = useCallback(async (visitor: {
    building_id: string
    name: string
    document_id: string
    type: 'pedestrian' | 'vehicle'
    vehicle_plate?: string
    destination_unit: string
    resident_name: string
  }) => {
    const response = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitor),
    })
    return response.json()
  }, [])

  const updateVisitor = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/visitors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createVisitor, updateVisitor }
}

export function useResidentApi() {
  const createResident = useCallback(async (resident: {
    building_id: string
    name: string
    unit: string
    phone?: string
    email?: string
  }) => {
    const response = await fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resident),
    })
    return response.json()
  }, [])

  const updateResident = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/residents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createResident, updateResident }
}

export function useParkingApi() {
  const createParkingSpot = useCallback(async (spot: {
    building_id: string
    code: string
    max_duration?: number
  }) => {
    const response = await fetch('/api/parking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spot),
    })
    return response.json()
  }, [])

  const updateParkingSpot = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/parking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createParkingSpot, updateParkingSpot }
}

export function useUserApi() {
  const createUser = useCallback(async (user: {
    email: string
    name: string
    role: string
    building_id?: string
  }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
    return response.json()
  }, [])

  const updateUser = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createUser, updateUser }
}

export function useAlertApi() {
  const createAlert = useCallback(async (alert: {
    building_id: string
    type: string
    title: string
    message: string
    priority?: string
  }) => {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    })
    return response.json()
  }, [])

  const updateAlert = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch('/api/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    return response.json()
  }, [])

  return { createAlert, updateAlert }
}

export function useCommunicationApi() {
  const createCommunication = useCallback(async (comm: {
    building_id: string
    author_id: string
    author_name: string
    title: string
    message: string
    type?: string
    priority?: string
    target_roles?: string[]
    includes_tenants?: boolean
  }) => {
    const response = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comm),
    })
    return response.json()
  }, [])

  return { createCommunication }
}
