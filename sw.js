// Service Worker — 2026 GISELLE LP
// 目的: PWA installable + 賢いキャッシュ(HTML は常に最新、 静的アセットはキャッシュ)
// 更新: 2026-05-25 v3 — HTML を network-first 化、 旧 cache の 404 汚染を完全排除

const CACHE_NAME = 'giselle-2026-v3';
const ESSENTIAL = [
  '/site.webmanifest',
  '/images/favicon-512.png',
  '/images/apple-touch-icon.png',
  '/dist/tailwind.min.css'
];

// install: 必須静的ファイルを cache(HTML は意図的に除外)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ESSENTIAL).catch(() => {}))
  );
});

// activate: 古い cache を全削除(v1 / v2 含む)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch: HTML は network-first / 静的アセットは cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/sw.js') || url.pathname.includes('firebaseio')) return;

  const isHTML = req.mode === 'navigate'
    || req.headers.get('accept')?.includes('text/html')
    || url.pathname.endsWith('.html')
    || url.pathname === '/'
    || (!url.pathname.includes('.') && url.pathname !== '');

  if (isHTML) {
    // === HTML: NETWORK-FIRST(常に最新、 オフライン時のみ cache) ===
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // 200 のみ cache、 404 / 5xx は絶対に cache に焼かない
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
    return;
  }

  // === 静的アセット: CACHE-FIRST + バックグラウンド更新 ===
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// message: フロントから skipWaiting / cache 全消去を要求できる
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});
