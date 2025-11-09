// 🌸 FemFlow Service Worker v4.1 (hotfix final)
const CACHE_NAME = 'femflow-cache-v4';

const ASSETS = [
  './',
  './index.html',
  './ciclo.html',
  './treino.html',
  './evolucao.html',
  './cadastro.html',
  './home.html',
  './style.css',
  './manifest.json',
  './js/memoria.js',
  './js/ciclo.js',
  './js/treino.js',
  './js/validacao.js',
  './js/cadastro.js',
  './icon-192.png',
  './icon-512.png',
  './offline.html'  // ✅ fallback adicionado
];

// 🪴 Instalação inicial
self.addEventListener('install', (event) => {
  console.log('📦 Instalando FemFlow PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('⚠️ Falha ao criar cache inicial:', err))
  );
});

// 🔁 Ativa nova versão
self.addEventListener('activate', (event) => {
  console.log(`✨ FemFlow Service Worker ativo (${CACHE_NAME}).`);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ⚙️ Estratégia de fetch: cache first + atualização silenciosa
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open("femflow-cache-v1");

      // 🔹 tenta resposta do cache primeiro
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // Atualiza em background
        fetch(event.request)
          .then((netResp) => {
            if (netResp && netResp.ok) {
              cache.put(event.request, netResp.clone());
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // 🔹 senão, busca da rede
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        console.warn("[SW] Erro de rede:", err);
        return caches.match("/offline.html");
      }
    })()
  );
});


// 🔄 Atualização manual (postMessage)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('🔁 Forçando atualização do Service Worker.');
    self.skipWaiting();
  }
  if (event.data === 'checkVersion') {
    console.log(`[FemFlow] Cache ativo: ${CACHE_NAME}`);
  }
});
