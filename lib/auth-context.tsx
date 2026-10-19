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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUserProfile = async (uid: string) => {
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, email, role, building_id')
      .eq('id', uid)
      .single()

    if (profile) {
      const mapped: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        buildingId: profile.building_id,
        buildingName: undefined,
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
