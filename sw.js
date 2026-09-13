/* Service worker: caché de vistas previas (cache-first) */
const CACHE = "er-previews-v2";
const HOSTS = ["img.youtube.com", "www.google.com", "t0.gstatic.com", "t1.gstatic.com", "t2.gstatic.com", "t3.gstatic.com"]; // capturas de sitios van a IndexedDB (validadas)

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !HOSTS.includes(url.hostname)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      try {
        const resp = await fetch(event.request);
        // Respuestas opacas (sin CORS) también se cachean; sirven para <img>.
        if (resp && (resp.ok || resp.type === "opaque")) cache.put(event.request, resp.clone());
        return resp;
      } catch (err) {
        return hit || Response.error();
      }
    })
  );
});
