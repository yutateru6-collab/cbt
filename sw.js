const CACHE_NAME = "cbt-grade2-app-shell-v87-public-entry-safety";
const APP_SHELL = [
  "/",
  "/index.html",
  "/exam.html",
  "/styles.css",
  "/grade2-normal-user-fixes.css",
  "/grade2-review-retry.css",
  "/grade2-progress-review.css",
  "/lp.css",
  "/app-config-grade2.js",
  "/grade2-scoring.js",
  "/app.js",
  "/grade2-speaking-listening-runtime-fixes.js",
  "/grade2-ai-grading-flow.js",
  "/grade2-ai-grading-flow.css",
  "/grade2-result-tabs.js",
  "/grade2-result-tabs.css",
  "/grade2-review-retry.js",
  "/grade2-review-resume.js",
  "/grade2-progress-review.js",
  "/grade2-developer-score-shortcut.js",
  "/grade2-developer-score-shortcut.css",
  "/grade2-listening-persistent-audio.js",
  "/exam-data.js",
  "/grade2-set-01.js",
  "/grade2-vocab-sets.js",
  "/grade2-speaking-sets.js",
  "/grade2-speaking-data-fixes.js",
  "/grade2-listening-part2-sets.js",
  "/grade2-listening-set01-audio-fixes.js",
  "/grade2-legacy-explanation-cleanup.js",
  "/grade2-set-01-explanations.js",
  "/grade2-skill-explanations.js",
  "/grade2-explanation-sync.js",
  "/grade2-canonical-explanations.js",
  "/grade2-explanation-provenance-dev.js",
  "/manifest.webmanifest",
  "/assets/app-icon.svg",
  "/assets/grade2-speaking-picture-story-02.png",
  "/assets/grade2-speaking-picture-story-02-anime.png",
  "/assets/grade2-speaking-picture-story-sample-anime.png",
  "/assets/grade2-speaking-picture-story-set-02-anime.png",
  "/assets/grade2-speaking-picture-story-set-03-anime.png",
  "/assets/grade2-speaking-picture-story-set-04-anime.png",
  "/assets/grade2-speaking-picture-story-set-05-anime.png",
  "/assets/grade2-speaking-picture-story-sample-v2.png",
  "/assets/grade2-speaking-picture-story-set-01-v2.png",
  "/assets/grade2-speaking-picture-story-set-02-v2.png",
  "/assets/grade2-speaking-picture-story-set-03-v2.png",
  "/assets/grade2-speaking-picture-story-sample-v3.png",
  "/assets/grade2-speaking-picture-story-set-01-v3.png",
  "/assets/grade2-speaking-picture-story-set-02-v3.png",
  "/assets/grade2-speaking-picture-story-set-03-v3.png",
  "/assets/grade2-speaking-picture-story-set-04-v3.png",
  "/assets/grade2-speaking-picture-story-set-05-v3.png",
];

const NETWORK_FIRST_RUNTIME_PATHS = new Set([
  "/exam.html",
  "/app.js",
  "/styles.css",
  "/grade2-normal-user-fixes.css",
  "/grade2-speaking-sets.js",
  "/grade2-speaking-data-fixes.js",
  "/grade2-speaking-listening-runtime-fixes.js",
  "/grade2-listening-persistent-audio.js",
  "/exam-data.js",
]);

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

function fetchAndRefreshRuntime(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === "basic") {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/assets/audio/") ||
    url.pathname.startsWith("/audio-r2/") ||
    url.pathname === "/bonus.html" ||
    url.pathname === "/output/pdf/eiken-grade2-final-check-writing-template.pdf"
  ) return;

  if (request.mode === "navigate") {
    const isPublicSampleExam =
      url.pathname !== "/exam.html" || String(url.searchParams.get("plan") || "").toLowerCase() === "sample";
    if (!isPublicSampleExam) {
      event.respondWith(fetchAndRefreshRuntime(request));
      return;
    }

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

  if (NETWORK_FIRST_RUNTIME_PATHS.has(url.pathname)) {
    event.respondWith(fetchAndRefreshRuntime(request));
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
