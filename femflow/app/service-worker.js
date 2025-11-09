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

// ⚙️ Estratégia de fetch: cache first + atualização silenciosa
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        // 🔹 1. tenta cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // atualiza em background sem bloquear a resposta
          fetch(event.request)
            .then(async (netResp) => {
              if (netResp && netResp.ok) {
                const cache = await caches.open("femflow-cache-v1");
                try {
                  const clone = netResp.clone();
                  await cache.put(event.request, clone);
                } catch (err) {
                  console.warn("[SW] Falha ao clonar resposta:", err.message);
                }
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // 🔹 2. sem cache → busca rede normalmente
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open("femflow-cache-v1");
          try {
            const clone = networkResponse.clone();
            await cache.put(event.request, clone);
          } catch (err) {
            console.warn("[SW] Falha ao clonar resposta:", err.message);
          }
        }
        return networkResponse;

      } catch (err) {
        console.warn("[SW] Erro no fetch handler:", err.message);
        return caches.match("/offline.html");
      }
    })()
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
