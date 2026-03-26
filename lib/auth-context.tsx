'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { User, UserRole } from './types'
import { mockUsers } from './mock-data'

interface AuthContextType {
  user: User | null
  login: (userId: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
  hydrateUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
  /** Ej.: signOut de Clerk cuando hay sesión externa. */
  onLogoutExtra?: () => void | Promise<void>
}

export function AuthProvider({ children, onLogoutExtra }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  const login = (userId: string) => {
    const foundUser = mockUsers.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
    }
  }

  const logout = () => {
    void onLogoutExtra?.()
    setUser(null)
  }

  const switchRole = (role: UserRole) => {
    const userWithRole = mockUsers.find((u) => u.role === role)
    if (userWithRole) {
      setUser(userWithRole)
    }
  }

  const hydrateUser = useCallback((next: User | null) => {
    setUser(next)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, login, logout, switchRole, hydrateUser }}
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
