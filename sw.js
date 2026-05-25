// Service Worker — 2026 GISELLE LP
// 目的: PWA installable + 基本キャッシュ(オフラインで HOME と直近見たページが表示できる)
// 更新: 2026-05-25 v1

const CACHE_NAME = 'giselle-2026-v1';
const ESSENTIAL = [
  '/',
  '/archive.html',
  '/site.webmanifest',
  '/images/favicon-512.png',
  '/images/apple-touch-icon.png',
  '/dist/tailwind.min.css'
];

// install: 必須ファイルを cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ESSENTIAL).catch(() => {}))
  );
});

// activate: 古い cache を削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: stale-while-revalidate(キャッシュ優先、 バックグラウンドで更新)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // POST / cross-origin / chrome-extension / Firebase は素通し
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/sw.js') || url.pathname.includes('firebaseio')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached); // オフラインなら cache を返す
      return cached || fetchPromise;
    })
  );
});
