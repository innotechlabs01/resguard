/**
 * Data hooks para la aplicación
 * - Si el usuario está logueado con Clerk: usa datos reales de la BD
 * - Si NO está logueado (demo mode): retorna array vacío (sin mock data)
 */

import { useState, useEffect, useCallback } from 'react'
import { isClerkFullyConfigured } from '@/lib/env'

function useAuthCheck() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Solo verificar una vez al cargar
    const hasClerk = isClerkFullyConfigured()
    setIsLoggedIn(hasClerk)
    setLoading(false)
  }, [])

  return { isLoggedIn, loading }
}

// ============================================
// HOOKS PARA DATOS - RETORNAN null SI NO HAY USER
// ============================================

export function useBuildingsData() {
  const { isLoggedIn, loading } = useAuthCheck()
  const [buildings, setBuildings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchBuildings = useCallback(async () => {
    if (!isLoggedIn) {
      setBuildings([])
      return
    }

    try {
      const res = await fetch('/api/buildings')
      const data = await res.json()
      if (data.buildings) {
        setBuildings(data.buildings)
      }
    } catch (err) {
      setError('Error cargando edificios')
      console.error(err)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!loading) {
      fetchBuildings()
    }
  }, [loading, fetchBuildings])

  return { buildings, loading, error, refetch: fetchBuildings }
}

export function useResidentsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [residents, setResidents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchResidents = useCallback(async () => {
    if (!isLoggedIn) {
      setResidents([])
      return
    }

    try {
      const res = await fetch(`/api/residents?buildingId=${buildingId || 'default'}`)
      const data = await res.json()
      if (data.residents) {
        setResidents(data.residents)
      }
    } catch (err) {
      setError('Error cargando residentes')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchResidents()
    }
  }, [loading, fetchResidents])

  return { residents, loading, error, refetch: fetchResidents }
}

export function useVisitorsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [visitors, setVisitors] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchVisitors = useCallback(async () => {
    if (!isLoggedIn) {
      setVisitors([])
      return
    }

    try {
      const res = await fetch(`/api/visitors?buildingId=${buildingId || 'default'}`)
      const data = await res.json()
      if (data.visitors) {
        setVisitors(data.visitors)
      }
    } catch (err) {
      setError('Error cargando visitantes')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchVisitors()
    }
  }, [loading, fetchVisitors])

  return { visitors, loading, error, refetch: fetchVisitors }
}

export function usePaymentsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [payments, setPayments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!isLoggedIn) {
      setPayments([])
      return
    }

    try {
      const url = buildingId ? `/api/payments?buildingId=${buildingId}` : '/api/payments'
      const res = await fetch(url)
      const data = await res.json()
      if (data.payments) {
        setPayments(data.payments)
      }
    } catch (err) {
      setError('Error cargando pagos')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchPayments()
    }
  }, [loading, fetchPayments])

  return { payments, loading, error, refetch: fetchPayments }
}

export function useParkingSpotsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [parkingSpots, setParkingSpots] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchParkingSpots = useCallback(async () => {
    if (!isLoggedIn) {
      setParkingSpots([])
      return
    }

    try {
      const url = buildingId ? `/api/parking?buildingId=${buildingId}` : '/api/parking'
      const res = await fetch(url)
      const data = await res.json()
      if (data.parkingSpots) {
        setParkingSpots(data.parkingSpots)
      }
    } catch (err) {
      setError('Error cargando parqueaderos')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchParkingSpots()
    }
  }, [loading, fetchParkingSpots])

  return { parkingSpots, loading, error, refetch: fetchParkingSpots }
}

export function useAlertsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [alerts, setAlerts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!isLoggedIn) {
      setAlerts([])
      return
    }

    try {
      const url = buildingId ? `/api/alerts?buildingId=${buildingId}` : '/api/alerts'
      const res = await fetch(url)
      const data = await res.json()
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (err) {
      setError('Error cargando alertas')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchAlerts()
    }
  }, [loading, fetchAlerts])

  return { alerts, loading, error, refetch: fetchAlerts }
}

export function useCommunicationsData(buildingId?: string) {
  const { isLoggedIn, loading } = useAuthCheck()
  const [communications, setCommunications] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchCommunications = useCallback(async () => {
    if (!isLoggedIn) {
      setCommunications([])
      return
    }

    try {
      const url = buildingId ? `/api/communications?buildingId=${buildingId}` : '/api/communications'
      const res = await fetch(url)
      const data = await res.json()
      if (data.communications) {
        setCommunications(data.communications)
      }
    } catch (err) {
      setError('Error cargando comunicaciones')
      console.error(err)
    }
  }, [isLoggedIn, buildingId])

  useEffect(() => {
    if (!loading) {
      fetchCommunications()
    }
  }, [loading, fetchCommunications])

  return { communications, loading, error, refetch: fetchCommunications }
}

export function useStatsData() {
  const { isLoggedIn, loading } = useAuthCheck()
  const [stats, setStats] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!isLoggedIn) {
      setStats(null)
      return
    }

    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError('Error cargando estadísticas')
      console.error(err)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!loading) {
      fetchStats()
    }
  }, [loading, fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

export function useUsersData() {
  const { isLoggedIn, loading } = useAuthCheck()
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!isLoggedIn) {
      setUsers([])
      return
    }

    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (err) {
      setError('Error cargando usuarios')
      console.error(err)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!loading) {
      fetchUsers()
    }
  }, [loading, fetchUsers])

  return { users, loading, error, refetch: fetchUsers }
}
