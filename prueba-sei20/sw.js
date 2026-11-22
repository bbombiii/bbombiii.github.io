/* SW de PRUEBA A: cachea solo la carcasa estatica de ESTA carpeta (/prueba-sei20/).
   Nunca intercepta Supabase (la demo lo sirve desde memoria) ni rutas fuera de su alcance. */
const CACHE = 'shuchu-prueba-a-v3';
const DIR = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
const SHELL = [
  './', 'index.html',
  'app.css?v=p6', 'app.js?v=p6', 'config.js?v=p6', 'demo.js?v=p6', 'kana-strokes.js?v=p6',
  'fondo-barcos.jpg', 'fondo-barcos-wide.jpg',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k.indexOf('shuchu-prueba-a-') === 0).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(DIR)) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
