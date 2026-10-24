// Service Worker を片付けるための版。このサイトは Service Worker を使わない。
// 以前のサイトでこのファイルを登録した端末では、次に開いた時にこの版へ入れ替わり、
// 保存していたものを全部消して、自分の登録も外す（ページの読み込みには手を出さない＝fetch の処理は置かない）。
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
