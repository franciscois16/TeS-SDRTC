/**
 * SERVICE WORKER — Colectivos Punta Arenas (Offline PWA)
 * ========================================================
 * Permite que la aplicación funcione completamente offline (sin internet)
 * y que pueda instalarse en celulares como Progressive Web App (PWA).
 */

const CACHE_NAME = 'colectivos-pua-v16';
const TILE_CACHE_NAME = 'colectivos-pua-tiles-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './editor.html',
  './motor.js',
  './data/rutas.js',
  './data/rutas.geojson',
  './manifest.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

/**
 * Normaliza las URLs de teselas de OpenStreetMap (a/b/c subdomains)
 * a una clave única canónica para que la caché funcione sin importar el subdominio.
 */
function getCanonicalTileUrl(urlStr) {
  const match = urlStr.match(/tile\.openstreetmap\.fr\/osmfr\/(\d+)\/(\d+)\/(\d+)\.png/);
  if (match) {
    return `https://a.tile.openstreetmap.fr/osmfr/${match[1]}/${match[2]}/${match[3]}.png`;
  }
  return null;
}

// 1. Instalación: Cachear recursos críticos del App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activación: Limpiar cachés antiguas (conservando siempre la caché de mapas)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== TILE_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de Fetch:
// - Teselas del mapa: Cache First sobre TILE_CACHE_NAME con clave normalizada (soporta CORS y Opaque)
// - App Shell y librerías: Cache First con respaldo de red
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  const canonicalTileUrl = getCanonicalTileUrl(event.request.url);

  // Manejo especializado para teselas del mapa (OpenStreetMap)
  if (canonicalTileUrl) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((tileCache) => {
        return tileCache.match(canonicalTileUrl).then((cachedTile) => {
          if (cachedTile) {
            return cachedTile;
          }
          return fetch(event.request).then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque')
            ) {
              tileCache.put(canonicalTileUrl, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Manejo general para App Shell y CDN (Leaflet, iconos, scripts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
