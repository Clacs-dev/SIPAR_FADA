// Service Worker do SIPAR-FADA: shell estático em cache (para instalação
// como PWA / arranque mais rápido) + notificações push. Nunca faz cache de
// pedidos à API (qualquer URL com "/api/") - esses vão sempre à rede, para
// nunca mostrar facturas/pedidos/actas desactualizados.
const CACHE_NAME = 'sipar-fada-shell-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/badge-72x72.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  // Só GET, só o mesmo site, e nunca chamadas à API - tudo isso vai
  // directo à rede, sem passar pelo cache.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('/api/')) return;

  // Rede primeiro, com o cache só como reserva para quando estiver
  // offline - evita servir para sempre uma versão antiga do shell da app
  // (ex: index.html a apontar para ficheiros JS/CSS de uma build antiga).
  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});

// Receber notificações push
self.addEventListener('push', function(event) {
 console.log('Service Worker: Push received', event);

  let notificationData = {
    title: 'SIPAR-FADA',
    body: 'Nova notificação disponível',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {},
    actions: [],
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
 console.log('Failed to parse push data as JSON:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: notificationData.requireInteraction,
    vibrate: [200, 100, 200],
    tag: notificationData.tag || 'default'
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', function(event) {
 console.log('Service Worker: Notification click received', event);

  event.notification.close();

  // Verificar se existe uma ação específica
  if (event.action) {
 console.log('Service Worker: Action clicked:', event.action);

    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow('/?notification=view')
        );
        break;
      case 'dismiss':
        // Apenas fechar a notificação
        break;
      default:
        event.waitUntil(
          clients.openWindow('/')
        );
    }
  } else {
    // Clique na notificação principal
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          // Se já existe uma janela aberta, focar nela
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }

          // Caso contrário, abrir nova janela
          if (clients.openWindow) {
            const notificationData = event.notification.data || {};
            let url = '/';

            // Personalizar URL baseado no tipo de notificação
            if (notificationData.type === 'status_change') {
              url = '/?tab=my-requests';
            } else if (notificationData.type === 'meeting_scheduled') {
              url = '/?tab=schedule';
            } else if (notificationData.type === 'broadcast') {
              url = '/?notification=broadcast';
            }

            return clients.openWindow(url);
          }
        })
    );
  }
});

// Lidar com fechamento da notificação
self.addEventListener('notificationclose', function(event) {
 console.log('Service Worker: Notification closed', event);

  const notificationData = event.notification.data || {};

  if (notificationData.trackClose) {
 console.log('Tracking notification close for:', notificationData);
  }
});

// Sincronização em background
self.addEventListener('sync', function(event) {
 console.log('Service Worker: Background sync', event);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      doBackgroundSync()
    );
  }
});

function doBackgroundSync() {
  return Promise.resolve();
}

const SW_VERSION = '1.1.0';
console.log(`Service Worker version ${SW_VERSION} loaded`);
