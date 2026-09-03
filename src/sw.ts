/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// Injected at build time by vite-plugin-pwa (injectManifest strategy) —
// the list of app-shell files to precache, same as the old generateSW
// output did automatically.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
self.clients.claim();

// ---- Runtime caching (equivalent to the previous generateSW config) ----
registerRoute(
  ({ url }) => url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/"),
  new NetworkFirst({
    cacheName: "supabase-rest-cache",
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/"),
  new CacheFirst({
    cacheName: "supabase-storage-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
);

// ---- Push notifications ----
interface PushPayload {
  title?: string;
  body?: string;
  url?: string; // in-app path to open on click, e.g. "/tasks"
  tag?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() }; }

  const title = payload.title || "ចម្ការទុរេន";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string })?.url || "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = allClients.find((c) => "focus" in c);
      if (existing) {
        await (existing as WindowClient).focus();
        // Navigate the already-open tab to the relevant page.
        if ("navigate" in existing) await (existing as WindowClient).navigate(targetUrl).catch(() => {});
        return;
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
