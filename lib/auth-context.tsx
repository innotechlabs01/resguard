'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, UserRole } from './types'
import { mockUsers } from './mock-data'

interface AuthContextType {
  user: User | null
  login: (userId: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (userId: string) => {
    const foundUser = mockUsers.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
    }
  }

  const logout = () => {
    setUser(null)
  }

  const switchRole = (role: UserRole) => {
    const userWithRole = mockUsers.find((u) => u.role === role)
    if (userWithRole) {
      setUser(userWithRole)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
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
