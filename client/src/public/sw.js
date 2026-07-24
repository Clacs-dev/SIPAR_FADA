// Service Worker para notificações push
const CACHE_NAME = 'apresentacoes-app-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Instalar service worker
self.addEventListener('install', function(event) {
 console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
 console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar service worker
self.addEventListener('activate', function(event) {
 console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
 console.log('Service Worker: Deleting old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Receber notificações push
self.addEventListener('push', function(event) {
 console.log('Service Worker: Push received', event);
  
  let notificationData = {
    title: 'Sistema de Gestão',
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
  
  // Opcional: enviar analytics sobre notificações fechadas
  const notificationData = event.notification.data || {};
  
  if (notificationData.trackClose) {
    // Aqui poderia enviar dados de tracking
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

// Função para sincronização em background
function doBackgroundSync() {
  // Implementar lógica de sincronização quando a conexão for restaurada
  return Promise.resolve();
}

// Lidar com mudanças na conectividade
self.addEventListener('online', function(event) {
 console.log('Service Worker: App is online');
  // Pode sincronizar dados quando voltar online
});

self.addEventListener('offline', function(event) {
 console.log('Service Worker: App is offline');
  // Pode armazenar dados para sincronizar depois
});

// Versionamento do service worker
const SW_VERSION = '1.0.0';
console.log(`Service Worker version ${SW_VERSION} loaded`);