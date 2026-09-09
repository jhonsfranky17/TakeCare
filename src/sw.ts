/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

function isPushPayload(value: unknown): value is PushPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.body === "string";
}

self.addEventListener("push", (event: PushEvent) => {
  const raw: unknown = event.data ? event.data.json() : null;
  const payload: PushPayload = isPushPayload(raw)
    ? raw
    : { title: "TakeCare", body: "You have a new update." };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const data: unknown = event.notification.data;
  const targetUrl =
    typeof data === "object" && data !== null && "url" in data
      ? String((data as { url: unknown }).url)
      : "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await (client as WindowClient).navigate(targetUrl);
          }
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
