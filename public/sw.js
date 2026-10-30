// Service worker PrettyCrea : l'application s'ouvre même sans connexion.
// Les données ne passent jamais par ce cache : elles sont chiffrées dans IndexedDB
// et synchronisées directement avec Supabase.
const VERSION = 'prettycrea-__VERSION__';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const RUNTIME_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Page : réseau d'abord (pour les mises à jour), cache si hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Fichiers de l'application, polices et bibliothèque Supabase : cache d'abord.
  if (url.origin === self.location.origin || RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
  // Tout le reste (API Supabase) passe directement par le réseau.
});

// Notifications : affichage et ouverture de la plateforme au toucher.
self.addEventListener('push', (event) => {
  let n = {};
  try { n = event.data ? event.data.json() : {}; } catch { n = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(n.title || 'PrettyCrea', {
    body: n.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: n.tag,
    data: { url: n.url || './' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data && event.notification.data.url || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.focus(); return c.navigate ? c.navigate(target) : null; }
    return self.clients.openWindow(target);
  }));
});
