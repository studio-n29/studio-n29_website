/* N29 HQ service worker: offline shell (stale-while-revalidate for same-origin GETs in this folder). Data never goes through it. */
const CACHE = "n29hq-shell-v1";
const SHELL = ["./", "index.html", "css/hq.css", "css/print.css", "manifest.webmanifest",
  "js/util.js", "js/store.js", "js/legal.js", "js/apex-data.js", "js/app.js",
  "js/views/clients.js", "js/views/projects.js", "js/views/docs.js", "js/views/dashboard.js", "js/views/apex.js", "js/views/tools.js", "js/views/compliance.js", "js/views/settings.js", "js/views/demo.js",
  "../assets/fonts/space-grotesk.woff2", "../assets/fonts/jetbrains-mono.woff2", "../favicon.svg", "../assets/apple-touch-icon.png", "../assets/favicon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then((res) => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
