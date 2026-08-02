importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD-resguard-d61f6',
  authDomain: 'resguard-d61f6.firebaseapp.com',
  projectId: 'resguard-d61f6',
  storageBucket: 'resguard-d61f6.appspot.com',
  messagingSenderId: '105534734062025167985',
  appId: '1:105534734062025167985:web:resguard',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload)
  
  const { notification, data } = payload
  
  self.registration.showNotification(notification?.title || 'Nueva notificación', {
    body: notification?.body || data?.message || '',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: data?.type || 'notification',
    data: data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        windowClients[0].focus()
      } else {
        clients.openWindow(urlToOpen)
      }
    })
  )
})
