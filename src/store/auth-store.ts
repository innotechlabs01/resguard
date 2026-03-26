import { create } from 'zustand'
import type { User } from '@/lib/types'
import type { StateCreator } from 'zustand'
import { useUser } from '@clerk/nextjs'

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  setUser: (user: User | null) => void
  setStatus: (status: AuthState['status']) => void
  login: () => Promise<void>
  logout: () => Promise<void>
  initializeAuth: () => void
}

const authStore: StateCreator<AuthState> = (set, get) => ({
  user: null,
  status: 'loading',
  setUser: (user: User | null) => set({ user }),
  setStatus: (status: AuthState['status']) => set({ status }),
  login: async () => {
    // Implement Clerk login flow
    set({ status: 'loading' })
    // Clerk redirect handled by <SignIn /> component
  },
  logout: async () => {
    // Implement Clerk logout
    set({ user: null, status: 'unauthenticated' })
    // In a real implementation, we would call Clerk's signOut
    // For now, we rely on Clerk's built-in sign out flow
  },
  initializeAuth: () => {
    // This would be used to set up real-time auth state updates
    // For now, we rely on Clerk's useUser hook in the sign-in page
  }
})

export const useAuthStore = create<AuthState>()(authStore)