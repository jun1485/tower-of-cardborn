const CACHE_NAME = 'tower-of-cardborn-v2';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/assets/ui/app_icon_192.png',
  '/assets/ui/app_icon_512.png',
  '/assets/ui/cursor-hero.svg',
  '/assets/ui/deck.png',
  '/assets/ui/bg_combat_tower-v2.webp',
  '/assets/ui/bg_map_1.webp',
  '/assets/ui/bg_map_2.webp',
  '/assets/ui/bg_map_3.webp',
  '/assets/classes/warrior-v2.webp',
  '/assets/classes/archer-v2.webp',
  '/assets/classes/mage-v2.webp',
  '/assets/classes/assassin-v2.webp',
  '/assets/fonts/MaplestoryLight.woff2',
  '/assets/fonts/MaplestoryBold.woff2',
  /* __BUILD_ASSETS__ */
];

// 필수 앱 셸 사전 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

// 이전 앱 셸 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

// 동일 출처 정적 자산 오프라인 응답
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/', response.clone());
          }
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // 이미지와 음원 최신본 우선 응답
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })),
  );
});
