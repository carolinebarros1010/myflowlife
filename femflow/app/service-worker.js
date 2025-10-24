// 🌸 FemFlow Service Worker v3
const CACHE_NAME = 'femflow-cache-v3';

const ASSETS = [
  // Core pages
  'index.html',
  'ciclo.html',
  'treino.html',
  'evolucao.html',
  'cadastro.html',

  // Styles & manifest
  'css/style.css',
  'manifest.json',

  // Scripts
  'js/memoria.js',
  'js/ciclo.js',
  'js/treino.js',
  'js/validacao.js',
  'js/cadastro.js',

  // Icons
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

// 🪴 Instala o novo service worker e faz cache inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // força ativação imediata
  );
});

// 🔁 Ativa nova versão e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // assume o controle imediato
  );
});

// ⚙️ Estratégia de busca com atualização automática
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Atualiza o cache silenciosamente
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => cachedResponse); // fallback offline

      // Retorna o cache primeiro (instantâneo), atualiza em background
      return cachedResponse || fetchPromise;
    })
  );
});

// 🌿 Notificação opcional no console (debug)
self.addEventListener('message', event => {
  if (event.data === 'checkVersion') {
    console.log('[FemFlow] Versão do cache ativa:', CACHE_NAME);
  }
});
