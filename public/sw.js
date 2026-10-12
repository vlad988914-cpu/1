/* ТехМайданчик — сервіс-воркер: швидкий старт і офлайн-заглушка. API (Supabase, /api) і відео не кешуємо. */
const V = "tm-v2";
const SHELL = ["/", "/offline.html", "/favicon.svg", "/icon-192.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith("/api/")) return; // чужі домени та API — напряму
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return; // відео не кешуємо (великі, Range-запити)
  if (r.mode === "navigate") {
    // сторінка: спершу мережа (завжди свіжа версія), без мережі — кеш або офлайн-заглушка
    const key = u.pathname.startsWith("/orenda/") ? u.pathname : "/"; // SEO-сторінки кешуються окремо, SPA — під "/"
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(key, cp)); } return res; }).catch(() => caches.match(key).then((m) => m || caches.match("/offline.html"))));
    return;
  }
  // статика: з кешу миттєво, у фоні оновлюємо
  e.respondWith(caches.match(r).then((hit) => {
    const net = fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
