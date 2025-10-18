// SW simples V24
const CACHE = "mfl-gerador-v24";
const CORE = ["./index.html","./styles.css","./app.js","./manifest.json"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(r=>{
      const copy = r.clone();
      caches.open(CACHE).then(c=>c.put(req, copy));
      return r;
    }).catch(()=> cached || new Response("offline", {status:200})))
  );
});

