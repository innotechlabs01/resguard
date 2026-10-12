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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      // Mock login fallback
      const { mockUsers } = await import('@/lib/mock-data')
      const mock = mockUsers.find(u => u.id === userId)
      if (mock) {
        setUser(mock)
        return
      }
    }
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
