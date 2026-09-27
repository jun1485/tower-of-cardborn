const CACHE_PREFIX = 'tower-of-cardborn-';
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_CACHE_VERSION__`;
const CORE_ASSETS = [
  '/',
  /* __BUILD_ASSETS__ */
];

// 앱 셸 필수 자산 판별 (실패 시 설치 중단 대상)
function isShellAsset(path) {
  return path === '/' || /\.(?:js|css|html|webmanifest)$/u.test(path);
}

// 앱 셸 원자 사전 캐시 + 이미지·음원 개별 사전 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await cache.addAll(CORE_ASSETS.filter(isShellAsset));
    await Promise.allSettled(CORE_ASSETS.filter((path) => !isShellAsset(path)).map((path) => cache.add(path)));
  }));
  self.skipWaiting();
});

// 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

// 응답 캐시 저장
async function putInCache(request, response) {
  if (!response.ok) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

// 동일 출처 정적 자산 오프라인 응답
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 문서 요청은 최신본 우선, 오프라인 시 캐시된 앱 셸
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache('/', response))
        .catch(async () => (await caches.match('/')) ?? Response.error()),
    );
    return;
  }

  // 빌드 버전별 캐시 자산은 캐시 우선, 미캐시 자산만 네트워크 조회 후 저장
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => putInCache(request, response))),
  );
});
