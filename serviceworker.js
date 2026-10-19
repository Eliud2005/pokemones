// ============================================
// Service Worker - Pokémon PWA
// ============================================

const CACHE_NAME = 'pokemon-pwa-v1';
const API_CACHE = 'pokemon-api-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './detalle.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/pokemons.js',
  './js/detalle.js',
  // Iconos PWA
  './img/icons/icon-72x72.png',
  './img/icons/icon-96x96.png',
  './img/icons/icon-128x128.png',
  './img/icons/icon-144x144.png',
  './img/icons/icon-152x152.png',
  './img/icons/icon-192x192.png',
  './img/icons/icon-384x384.png',
  './img/icons/icon-512x512.png'
];

// ============================================
// INSTALL: precachear recursos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE: limpiar cachés antiguas
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Eliminando caché antigua:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================
// FETCH: Cache First para assets, Network First para API
// ============================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // --- PokéAPI: Cache First con revalidación ---
  if (url.startsWith('https://pokeapi.co/api/v2/pokemon')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) {
            // Revalidar en background
            event.waitUntil(
              fetch(event.request)
                .then((res) => {
                  if (res.ok) cache.put(event.request, res.clone());
                })
                .catch(() => {})
            );
            return cached;
          }
          return fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // --- Sprites de Pokémon (raw.githubusercontent.com) ---
  if (url.startsWith('https://raw.githubusercontent.com/PokeAPI/sprites')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          return cached || fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // --- Assets locales: Cache First con revalidación ---
  if (!url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(() => {})
        );
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
    })
  );
});

// ============================================
// MESSAGE: skipWaiting desde la app
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});