const CACHE_NAME = "fixili-v3";
const OFFLINE_URL = "/onboarding";

const PRECACHE = [
  "/",
  "/onboarding",
  "/login",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install ────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — network first, cache fallback ──────────────────────────────
self.addEventListener("fetch", (event) => {
  // Skip non-GET and browser-extension requests
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // API routes — network only, never cache
  if (event.request.url.includes("/api/")) {
    return;
  }

  // Navigation requests — network first, offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) => cached ?? new Response("Offline", { status: 503 })
        )
      )
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          // Cache successful responses for static assets
          if (
            response.ok &&
            (event.request.url.includes("/icons/") ||
              event.request.url.includes("/models/") ||
              event.request.url.endsWith(".png") ||
              event.request.url.endsWith(".svg") ||
              event.request.url.endsWith(".woff2"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
    )
  );
});

// ── Push notifications ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Fixili", body: event.data ? event.data.text() : "" };
  }

  // A notification MUST always be shown (iOS/Chrome drop the subscription otherwise)
  const options = {
    body:               data.body ?? "",
    icon:               "/icons/icon-192.png",
    badge:              "/icons/icon-192.png",
    tag:                data.tag ?? "fixili-notif",
    renotify:           true,
    data:               { url: data.url ?? "/notifications" },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Fixili", options)
  );
});

// The browser changed/renewed the subscription → save the new one
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((sub) => {
        const json = sub.toJSON();
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
        });
      })
      .catch(() => {})
  );
});

// ── Notification click ─────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("navigate" in client) {
            return client.navigate(url).then((c) => (c || client).focus());
          }
        }
        return clients.openWindow(url);
      })
  );
});

// ── Background sync (for offline actions) ─────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    // Future: sync pending messages when back online
    console.log("[SW] Background sync:", event.tag);
  }
});