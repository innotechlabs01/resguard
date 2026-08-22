'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
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

// Inner provider that receives Clerk state from parent
function AuthProviderInner({
  children,
  onLogoutExtra,
  clerkUser,
  clerkLoaded,
  signOut,
}: {
  children: ReactNode
  onLogoutExtra?: () => void | Promise<void>
  clerkUser: any
  clerkLoaded: boolean
  signOut: () => Promise<void>
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!clerkLoaded) return

    setIsLoaded(true)

    if (clerkUser) {
      const role = (clerkUser.publicMetadata?.role as UserRole) || 'usuario'
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
        hydrateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Wrapper that safely loads Clerk hooks
function ClerkWrapper({ children, onLogoutExtra }: AuthProviderProps) {
  const [clerkReady, setClerkReady] = useState(false)
  const [clerkState, setClerkState] = useState<{ user: any; loaded: boolean; signOut: () => Promise<void> }>({
    user: null,
    loaded: false,
    signOut: async () => {},
  })

  useEffect(() => {
    // Dynamically load Clerk hooks only on client side
    import('@clerk/nextjs')
      .then(({ useUser, useClerk }) => {
        // These hooks can't be called dynamically, so we use a different approach
        setClerkReady(true)
      })
      .catch(() => {
        // Clerk not available, use fallback
        setClerkReady(true)
      })
  }, [])

  // During SSR/static generation, render without Clerk
  if (typeof window === 'undefined') {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isLoaded: false,
          isAuthenticated: false,
          isDemoMode: true,
          login: () => {},
          logout: async () => {},
          switchRole: () => {},
          hydrateUser: () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <ClerkBrowserWrapper children={children} onLogoutExtra={onLogoutExtra} />
}

// Client-side wrapper that uses Clerk hooks
function ClerkBrowserWrapper({ children, onLogoutExtra }: AuthProviderProps) {
  let useUser: any, useClerk: any

  try {
    const clerk = require('@clerk/nextjs')
    useUser = clerk.useUser
    useClerk = clerk.useClerk
  } catch {
    // Fallback if Clerk not available
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isLoaded: true,
          isAuthenticated: false,
          isDemoMode: true,
          login: () => {},
          logout: async () => {},
          switchRole: () => {},
          hydrateUser: () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut } = useClerk()

  return (
    <AuthProviderInner
      children={children}
      onLogoutExtra={onLogoutExtra}
      clerkUser={clerkUser}
      clerkLoaded={clerkLoaded}
      signOut={signOut}
    />
  )
}

export function AuthProvider({ children, onLogoutExtra }: AuthProviderProps) {
  return (
    <ClerkWrapper children={children} onLogoutExtra={onLogoutExtra} />
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
