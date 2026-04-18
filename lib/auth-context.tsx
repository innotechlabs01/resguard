'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { User, UserRole } from './types'

interface AuthContextType {
  user: User | null
  isLoaded: boolean
  isAuthenticated: boolean
  isDemoMode: boolean
  login: (userId: string) => void
  logout: () => void
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
  
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    if (!clerkLoaded) return
    
    setIsLoaded(true)

    if (clerkUser) {
      const role = clerkUser.publicMetadata?.role as UserRole || 'usuario'
      const buildingId = clerkUser.publicMetadata?.buildingId as string | undefined
      
      const realUser: User = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || 'Usuario',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        role,
        buildingId,
        buildingName: clerkUser.publicMetadata?.buildingName as string | undefined,
      }
      
      setUser(realUser)
    } else {
      setUser(null)
    }
  }, [clerkUser, clerkLoaded])

  const login = (userId: string) => {
    // Not used in Clerk mode
  }

  const logout = async () => {
    await signOut()
    await onLogoutExtra?.()
    setUser(null)
  }

  const switchRole = (role: UserRole) => {
    // Not used in Clerk mode
  }

  const hydrateUser = useCallback((next: User | null) => {
    setUser(next)
  }, [])

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isLoaded: isLoaded && clerkLoaded, 
        isAuthenticated: !!clerkUser,
        isDemoMode: !clerkUser,
        login, 
        logout, 
        switchRole, 
        hydrateUser 
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
