// 🌸 FemFlow Service Worker v3
const CACHE_NAME = 'femflow-cache-v3';

const ASSETS = [
  // Core pages
  './index.html',
  './ciclo.html',
  './treino.html',
  './evolucao.html',
  './cadastro.html',

  // Styles & manifest
  './css/style.css',
  './manifest.json',

  // Scripts
  './js/memoria.js',
  './js/ciclo.js',
  './js/treino.js',
  './js/validacao.js',
  './js/cadastro.js',

  // Icons (importantes pro PWA e instalação offline)
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'

  // Videos (importantes pro PWA e instalação offline)
  './videos/video_menstrual_1.mp4',
'./videos/video_folicular_7.mp4',
'./videos/video_ovulatoria_14.mp4',
'./videos/video_lutea_17.mp4'

];

// 🪴 Instalação inicial — faz cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 🔁 Ativa nova versão e limpa caches antigos automaticamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ⚙️ Intercepta requests — usa cache first + update em background
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// 🧠 Auto-update detector (opcional)
self.addEventListener('message', (event) => {
  if (event.data === 'checkVersion') {
    console.log(`[FemFlow] Cache ativo: ${CACHE_NAME}`);
  }
});

