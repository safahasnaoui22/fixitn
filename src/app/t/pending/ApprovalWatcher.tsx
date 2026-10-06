"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Checks every 5s (and when the tab becomes visible again) whether the admin
// approved this technician. As soon as it happens → go to the dashboard.
export function ApprovalWatcher() {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;

    async function check() {
      try {
        const res = await fetch("/api/technician/status", { cache: "no-store" });
        if (res.status === 401) {
          stopped = true;
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!stopped && data.approved) {
          stopped = true;
          router.replace("/t/dashboard");
          router.refresh();
        }
      } catch {
        /* network hiccup — try again on next tick */
      }
    }

    check();
    const id = setInterval(check, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}