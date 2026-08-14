const CACHE_NAME = "cbt-grade2-app-shell-v63-speaking-scroll-fix";
const APP_SHELL = [
  "/",
  "/index.html",
  "/exam.html",
  "/styles.css",
  "/lp.css",
  "/app-config-grade2.js",
  "/grade2-scoring.js",
  "/app.js",
  "/exam-data.js",
  "/grade2-set-01.js",
  "/grade2-set-01-explanations.js",
  "/grade2-skill-explanations.js",
  "/grade2-vocab-sets.js",
  "/grade2-speaking-sets.js",
  "/grade2-listening-part2-sets.js",
  "/manifest.webmanifest",
  "/assets/app-icon.svg",
  "/assets/grade2-speaking-examiner-photo.png",
  "/assets/grade2-speaking-picture-story-02-anime.png",
  "/assets/grade2-speaking-picture-story-sample-anime.png",
  "/assets/grade2-speaking-picture-story-set-02-anime.png",
  "/assets/grade2-speaking-picture-story-set-03-anime.png",
  "/assets/grade2-speaking-picture-story-set-04-anime.png",
  "/assets/grade2-speaking-picture-story-set-05-anime.png",
  "/assets/grade2-speaking-picture-story-sample-v2.png",
  "/assets/grade2-speaking-picture-story-set-01-v2.png",
  "/assets/grade2-speaking-picture-story-set-02-v2.png",
  "/assets/grade2-speaking-picture-story-set-03-v2.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/assets/audio/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/exam.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
