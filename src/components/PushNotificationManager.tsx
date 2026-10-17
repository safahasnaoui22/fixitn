"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Pages where nobody is logged in yet (or a face check is running)
const SKIP = ["/onboarding", "/login", "/register", "/forgot-password", "/face-setup", "/face-verify", "/terms"];
const DISMISS_KEY = "push-banner-dismissed";

async function save(sub: PushSubscription) {
  const json = sub.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  }).catch(() => {});
}

/**
 * Push notifications for the installed app (PWA).
 * - Runs on every page change, so a user who logs in WITHOUT reloading the page
 *   is subscribed too (the old version only ran once, before login → 401).
 * - Asks the permission from a button (browsers + iOS require a user tap).
 */
export function PushNotificationManager() {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));
    await save(sub);
  }, []);

  useEffect(() => {
    if (SKIP.some((p) => pathname.startsWith(p))) {
      setShowBanner(false);
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    let cancelled = false;
    (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (cancelled || !data?.valid) return; // not logged in

        if (Notification.permission === "granted") {
          await subscribe(); // keeps the DB in sync with this device
        } else if (Notification.permission === "default") {
          let dismissed = false;
          try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch {}
          if (!dismissed) setShowBanner(true);
        }
      } catch (e) {
        console.warn("Push setup:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [pathname, subscribe]);

  async function enable() {
    setShowBanner(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribe();
    } catch (e) {
      console.warn("Push enable:", e);
    }
  }

  function dismiss() {
    setShowBanner(false);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-[60] mx-auto w-full max-w-[480px] px-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121C26] px-4 py-3 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <Bell size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Activer les notifications</p>
          <p className="text-xs text-white/60">Recevez les messages et demandes même app fermée.</p>
        </div>
        <button
          onClick={enable}
          className="shrink-0 rounded-full bg-brand-orange px-3.5 py-2 text-xs font-bold text-white"
        >
          Activer
        </button>
        <button onClick={dismiss} aria-label="Fermer" className="shrink-0 text-white/50">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
