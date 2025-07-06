const CACHE_NAME = 'haushalts-app-v3';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache wird geöffnet');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Alle Ressourcen gecached');
        // Sofort aktivieren ohne auf andere Tabs zu warten
        return self.skipWaiting();
      })
  );
});

// Fetch event - erweiterte Strategie
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache-First Strategie für App-Ressourcen
        if (response) {
          return response;
        }

        // Netzwerk-Anfrage für nicht gecachte Ressourcen
        return fetch(event.request).then((fetchResponse) => {
          // Prüfen ob die Antwort gültig ist
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Antwort klonen für Cache
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      })
      .catch(() => {
        // Offline-Fallback
        console.log('Service Worker: Offline - keine Netzwerkverbindung');
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Activate event - sofort übernehmen und alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Alte Caches löschen
        ...cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Alter Cache gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        }),
        // Sofort die Kontrolle übernehmen
        clients.claim()
      ]);
    })
  );
});

// Update-Benachrichtigung an App
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});