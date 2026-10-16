"use client";

import { useEffect } from "react";

const CHECK_EVERY_MS = 15_000;

/**
 * Logs this device out automatically (within ~15 s, or immediately when the
 * app comes back to the foreground) after the same account logged in on
 * another device. It does nothing for visitors who are not logged in.
 */
export function SessionGuard() {
  useEffect(() => {
    let stopped = false;

    async function check() {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { valid: boolean; hadSession: boolean };
        if (!stopped && data.hadSession && !data.valid) {
          stopped = true;
          window.location.href =
            "/login?error=" +
            encodeURIComponent(
              "Your session was ended because you logged in from another device."
            );
        }
      } catch {
        // offline or server restarting: try again next time
      }
    }

    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
