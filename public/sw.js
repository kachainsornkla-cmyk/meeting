// Service Worker for BOOKING PWK-ROOM PWA

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to read vibration setting from IndexedDB (PWA offline storage)
function getVibrateSetting() {
  return new Promise((resolve) => {
    if (!('indexedDB' in self)) {
      resolve(true); // Default to enabled
      return;
    }
    try {
      const request = indexedDB.open('NotiSettings', 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          resolve(true);
          return;
        }
        const tx = db.transaction('settings', 'readonly');
        const getRequest = tx.objectStore('settings').get('noti_vibrate');
        getRequest.onsuccess = () => {
          resolve(getRequest.result !== false); // Default to true if not explicitly false
        };
        getRequest.onerror = () => resolve(true);
      };
      request.onerror = () => resolve(true);
    } catch (err) {
      resolve(true);
    }
  });
}

// Handle push notification events from server/background (Full features: Banner, Sound, Vibration, Actions)
self.addEventListener('push', (event) => {
  let data = { title: 'BOOKING PWK-ROOM', body: 'คุณมีการแจ้งเตือนใหม่ในระบบ' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'BOOKING PWK-ROOM', body: event.data.text() };
    }
  }

  event.waitUntil(
    getVibrateSetting().then((vibrateEnabled) => {
      const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: vibrateEnabled ? [200, 100, 200, 100, 200] : undefined, // Premium vibration pattern if enabled
        tag: 'booking-alert',
        renotify: true,
        actions: [
          {
            action: 'open-app',
            title: '👉 ดูรายละเอียด'
          }
        ],
        data: {
          url: data.url || '/dashboard'
        }
      };

      return self.registration.showNotification(data.title, options);
    })
  );
});

// Handle click on background notifications and action buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and redirect
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
