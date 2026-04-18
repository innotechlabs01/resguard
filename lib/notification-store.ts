'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GuardNotification {
  id: string
  type: 'visitor' | 'package' | 'alert'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

interface GuardNotificationStore {
  notifications: GuardNotification[]
  addNotification: (notification: Omit<GuardNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

export const useGuardNotificationStore = create<GuardNotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: GuardNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      clearNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length
      },
    }),
    {
      name: 'guard-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
)
