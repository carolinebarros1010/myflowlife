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

// ⚙️ Estratégia: cache first + update silencioso
self.addEventListener("fetch", (event) => {
  // ⚠️ Ignora chamadas externas (Firebase, APIs, Hotmart)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    (async () => {
      try {
        // 1️⃣ tenta cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // atualiza em background
          fetch(event.request)
            .then(async (netResp) => {
              if (netResp && netResp.ok) {
                const cache = await caches.open(CACHE_NAME);
                try {
                  await cache.put(event.request, netResp.clone());
                } catch (err) {
                  console.warn("[SW] Falha ao clonar resposta:", err.message);
                }
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // 2️⃣ sem cache → busca rede
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          try {
            await cache.put(event.request, networkResponse.clone());
          } catch (err) {
            console.warn("[SW] Falha ao clonar resposta:", err.message);
          }
        }
        return networkResponse;

      } catch (err) {
        console.warn("[SW] Erro no fetch handler:", err.message);
        // 3️⃣ fallback
        return caches.match("./offline.html") ||
               new Response("🌸 FemFlow está offline.", { headers: { "Content-Type": "text/html" } });
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
