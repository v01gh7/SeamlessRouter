/**
 * Service Worker для кэширования и офлайн-режима
 */

const CACHE_NAME = 'router-cache-v1';
const OFFLINE_PAGE = '/offline.html';

// Страницы, которые всегда должны быть в кэше
const ALWAYS_CACHE = [
  '/',
  '/index.html',
  '/offline.html'
];

// Расширения для статических файлов
const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

/**
 * Проверить, является ли URL статическим файлом
 */
function isStaticFile(url) {
  return STATIC_EXTENSIONS.some(ext => url.endsWith(ext));
}

/**
 * Проверить, нужно ли кэшировать URL
 */
function shouldCache(url) {
  // Не кэшируем данные API
  if (url.includes('/api/') || url.includes('/graphql')) {
    return false;
  }
  
  // Не кэшируем websocket
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return false;
  }
  
  return true;
}

/**
 * Установка Service Worker
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching essential pages...');
        return cache.addAll(ALWAYS_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
  );
});

/**
 * Активация Service Worker
 */
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Удаляем старые кэши
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Обработка fetch-запросов
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Пропускаем внешние ресурсы
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Проверяем, нужно ли кэшировать
  if (!shouldCache(url.pathname)) {
    return;
  }
  
  event.respondWith(
    handleFetch(event.request)
      .catch(error => {
        console.error('❌ Fetch failed:', error);
        return handleOffline(event.request);
      })
  );
});

/**
 * Обработка fetch-запроса с кэшированием
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  
  // Для статических файлов используем CacheFirst стратегию
  if (isStaticFile(url.pathname)) {
    return cacheFirst(request);
  }
  
  // Для HTML страниц используем NetworkFirst стратегию
  return networkFirst(request);
}

/**
 * Стратегия CacheFirst (для статических файлов)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log(`🎯 Cache hit (CacheFirst): ${request.url}`);
    return cachedResponse;
  }
  
  console.log(`❌ Cache miss (CacheFirst): ${request.url}`);
  const networkResponse = await fetch(request);
  
  // Кэшируем ответ
  if (networkResponse.ok) {
    console.log(`💾 Caching (CacheFirst): ${request.url}`);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Стратегия NetworkFirst (для HTML страниц)
 */
async function networkFirst(request) {
  try {
    console.log(`🌐 Network request: ${request.url}`);
    const networkResponse = await fetch(request);
    
    // Кэшируем успешные ответы
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      console.log(`💾 Caching (NetworkFirst): ${request.url}`);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`📦 Fallback to cache: ${request.url}`);
    
    // Пробуем получить из кэша
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log(`🎯 Cache hit (NetworkFirst): ${request.url}`);
      return cachedResponse;
    }
    
    // Если нет в кэше, показываем офлайн-страницу
    throw error;
  }
}

/**
 * Обработка офлайн-режима
 */
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Для HTML запросов показываем офлайн-страницу
  if (request.headers.get('Accept')?.includes('text/html')) {
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match(OFFLINE_PAGE);
    
    if (offlinePage) {
      console.log(`📴 Showing offline page for: ${url.pathname}`);
      return offlinePage;
    }
  }
  
  // Для других типов запросов возвращаем ошибку
  return new Response('Network error', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

/**
 * Очистка кэша
 */
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🧹 All caches cleared');
}

/**
 * Получение статистики кэша
 */
async function getCacheStats() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  let totalSize = 0;
  const entries = [];
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const body = await response.clone().text();
      const size = new Blob([body]).size;
      totalSize += size;
      
      entries.push({
        url: request.url,
        size: size,
        timestamp: response.headers.get('date') || new Date().toISOString()
      });
    }
  }
  
  return {
    totalEntries: keys.length,
    totalSize: totalSize,
    entries: entries
  };
}

// Экспортируем функции для использования из основного потока
self.getCacheStats = getCacheStats;
self.clearCache = clearCache;