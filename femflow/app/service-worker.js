// FemFlow Service Worker
const CACHE_NAME = 'femflow-cache-v1';
const ASSETS = [
  // core pages
  'index.html',
  'ciclo.html',
  'treino.html',
  'evolucao.html',
  'cadastro.html',
  // styles and manifest
  'css/style.css',
  'manifest.json',
  // scripts
  'js/memoria.js',
  'js/ciclo.js',
  'js/treino.js',
  'js/validacao.js',
  'js/cadastro.js',
  // icons
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache the new resource for future use
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        // fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/femflow/app/index.html');
        }
      });
    })
  );
});