'use client'

import { useEffect, useCallback } from 'react'
import { getFcmToken, onForegroundMessage } from '@/lib/firebase-client'
import { useGuardNotificationStore } from '@/lib/notification-store'

export function usePushNotifications() {
  const { addNotification } = useGuardNotificationStore()

  const handleForegroundMessage = useCallback((payload: any) => {
    const { notification, data } = payload
    
    const type = data?.type as 'visitor' | 'package' | 'alert' || 'alert'
    const title = notification?.title || 'Nueva notificación'
    const message = notification?.body || data?.message || ''

    addNotification({
      type,
      title,
      message,
      data,
    })

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        tag: type,
      })
    }
  }, [addNotification])

  useEffect(() => {
    if (typeof window === 'undefined') return

    async function initPushNotifications() {
      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          console.log('Notification permission granted')
          
          const token = await getFcmToken()
          if (token) {
            console.log('FCM Token:', token)
            
            // TODO: Send token to your backend to store for this user
            // await fetch('/api/notifications/register-token', {
            //   method: 'POST',
            //   body: JSON.stringify({ token, userId: user?.id }),
            // })
          }

          // Listen for foreground messages
          const unsubscribe = onForegroundMessage(handleForegroundMessage)
          
          return () => {
            unsubscribe()
          }
        } else {
          console.log('Notification permission denied')
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error)
      }
    }

    initPushNotifications()
  }, [handleForegroundMessage])
}
