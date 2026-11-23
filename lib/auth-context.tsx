'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, UserRole } from './types'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  isLoaded: boolean
  isAuthenticated: boolean
  isDemoMode: boolean
  login: (userId: string) => void
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
  hydrateUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
  onLogoutExtra?: () => void | Promise<void>
}

export function AuthProvider({ children, onLogoutExtra }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (uid: string) => {
    let profile: Record<string, any> | null
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, building_id, organization_id, unit, phone')
      .eq('id', uid)
      .single()

    if (!error && data) {
      profile = data
    } else {
      const { data: fallbackData } = await supabase
        .from('users')
        .select('id, name, email, role, building_id, organization_id')
        .eq('id', uid)
        .single()
      profile = fallbackData
    }

    if (profile) {
      let buildingName: string | undefined = undefined
      let unit: string | undefined = profile.unit || undefined
      let phone: string | undefined = profile.phone || undefined
      let isTenant: boolean | undefined = undefined

      if (profile.building_id) {
        const { data: bldg } = await supabase
          .from('buildings')
          .select('name')
          .eq('id', profile.building_id)
          .maybeSingle()
        if (bldg?.name) {
          buildingName = bldg.name
        }
      }

      if (!unit || !phone) {
        let residentRow: { unit?: string | null; phone?: string | null; is_tenant?: boolean | null } | null = null
        const { data: byUid } = await supabase
          .from('residents')
          .select('unit, phone, is_tenant')
          .eq('user_id', uid)
          .limit(1)
          .maybeSingle()

        if (byUid) {
          residentRow = byUid
        } else if (profile.email) {
          const { data: byEmail } = await supabase
            .from('residents')
            .select('unit, phone, is_tenant')
            .eq('email', profile.email)
            .limit(1)
            .maybeSingle()
          residentRow = byEmail
        }

        if (residentRow) {
          if (!unit && residentRow.unit) unit = residentRow.unit
          if (!phone && residentRow.phone) phone = residentRow.phone
          if (typeof residentRow.is_tenant === 'boolean') isTenant = residentRow.is_tenant
        }
      }

      const mapped: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        buildingId: profile.building_id ?? undefined,
        buildingName,
        organizationId: profile.organization_id ?? undefined,
        unit,
        phone,
        isTenant,
      }
      setUser(mapped)
    } else {
      setUser(null)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    await onLogoutExtra?.()
    setUser(null)
  }

  const login = async (userId: string) => {
    // T-036: mock login fallback removed. Only real Supabase Auth profiles
    // are accepted; non-UUID or unknown IDs return no session.
    await loadUserProfile(userId)
  }

  const switchRole = (role: UserRole) => {
    setUser(prev => prev ? { ...prev, role } : prev)
  }

  const hydrateUser = useCallback((next: User | null) => {
    setUser(next)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isAuthenticated: !!user,
        isDemoMode: false,
        login,
        logout,
        switchRole,
        hydrateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
