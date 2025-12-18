// Service Worker for Open Ham Prep PWA
// Provides offline caching and faster load times
// Strategy: Network-first with cache fallback for static assets

const CACHE_NAME = 'ham-prep-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png'
];

// API URL patterns that should never be cached (always fetch from network)
// Using specific Supabase domains rather than broad string matching
const API_PATTERNS = ['/rest/', '/auth/', '.supabase.co', '.supabase.in'];
const shouldSkipCaching = (url) => API_PATTERNS.some(pattern => url.includes(pattern));

// Maximum number of dynamic cache entries to prevent unbounded growth
const MAX_CACHE_SIZE = 50;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((error) => {
        console.error('Service worker install failed:', error);
        // Don't throw - allow SW to install even if some assets fail
        // This prevents a single 404 from breaking the entire PWA
      })
  );
  // Note: We intentionally do NOT call skipWaiting() here.
  // Updates are triggered by user confirmation via postMessage.
});

// Listen for skip waiting message from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch event - network-first strategy with cache fallback
// This ensures users get fresh content when online, but can still use the app offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests - let browser handle POST/PUT/DELETE normally
  // (bare return allows request to proceed via browser's default fetch)
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests - let browser handle them normally
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests (Supabase) - never cache to prevent stale data
  // Browser will handle these requests normally without service worker intervention
  if (shouldSkipCaching(event.request.url)) {
    return;
  }

  // Only intercept GET requests for same-origin static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching (response can only be consumed once)
        const responseToCache = response.clone();

        // Cache successful responses asynchronously (fire-and-forget for performance)
        // Don't await - caching shouldn't block the response to the user
        if (response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            // Enforce cache size limit to prevent unbounded storage growth
            cache.keys().then(async (keys) => {
              if (keys.length > MAX_CACHE_SIZE) {
                // Remove oldest entries (FIFO) until under limit
                const deleteCount = keys.length - MAX_CACHE_SIZE;
                const deletePromises = keys.slice(0, deleteCount).map(key => cache.delete(key));
                await Promise.all(deletePromises).catch(err =>
                  console.warn('Cache eviction failed:', err)
                );
              }
            }).catch(err => console.warn('Cache size check failed:', err));
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If request is for a page, return the cached index for SPA routing
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          // No cache available
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
