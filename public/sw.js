const CACHE = "fixitn-v1";
const OFFLINE = "/onboarding";

// Install — cache the shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/login"]))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to offline page for navigation
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE))
    );
  }
});

// Push — show notification
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: "FixiTN", body: e.data.text(), url: "/" };
  }

  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag ?? "fixitn-notif",
    data: { url: data.url ?? "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: data.url
      ? [{ action: "open", title: "View" }, { action: "dismiss", title: "Dismiss" }]
      : [],
  };

  e.waitUntil(
    self.registration.showNotification(data.title ?? "FixiTN", options)
  );
});

// Notification click — open or focus the right page
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;

  const url = e.notification.data?.url ?? "/";

  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // If app window already open, navigate it
        for (const client of list) {
          if ("navigate" in client) {
            client.focus();
            return client.navigate(url);
          }
        }
        // Otherwise open new window
        return clients.openWindow(url);
      })
  );
});