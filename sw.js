/* 포켓몬 워크 서비스워커 — 알림 표시 + 간단 오프라인 캐시 */
const CACHE = 'pw-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;            // 외부(PokeAPI 등)는 그대로 네트워크
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// 페이지 → SW 로 알림 요청 전달
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'notify') {
    self.registration.showNotification(d.title || '포켓몬 워크', {
      body: d.body || '',
      icon: d.icon,
      badge: d.icon,
      tag: 'pw-step',
      renotify: true
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window'}).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    if (self.clients.openWindow) return self.clients.openWindow('./index.html');
  }));
});
