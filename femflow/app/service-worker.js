// 🌸 FemFlow Service Worker v4 (final)
const CACHE_NAME = 'femflow-cache-v4';

const ASSETS = [
  // Core pages
  './',
  './index.html',
  './ciclo.html',
  './treino.html',
  './evolucao.html',
  './cadastro.html',
  './home.html',
  './login.html',

  // Styles & manifest
  './style.css',
  './manifest.json',

  // Scripts
  './js/memoria.js',
  './js/ciclo.js',
  './js/treino.js',
  './js/validacao.js',
  './js/cadastro.js',

  // Icons (necessários para PWA)
  './icon-192.png',
  './icon-512.png'
];

// 🪴 Instalação inicial: cria cache com os arquivos base
self.addEventListener('install', (event) => {
  console.log('📦 Instalando FemFlow PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('⚠️ Falha ao criar cache inicial:', err))
  );
});

// 🔁 Ativa nova versão e remove caches antigos
self.addEventListener('activate', (event) => {
  console.log('✨ FemFlow Service Worker ativo.');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ⚙️ Estratégia de fetch: cache first, update em background
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // evita cachear POST/PUT

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

// 🔄 Atualização manual (usada via postMessage)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('🔁 Forçando atualização do Service Worker.');
    self.skipWaiting();
  }
  if (event.data === 'checkVersion') {
    console.log(`[FemFlow] Cache ativo: ${CACHE_NAME}`);
  }
});
