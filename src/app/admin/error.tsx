"use client";

import { useEffect } from "react";

/** Shows a readable error inside the admin panel instead of a blank page. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
      <p className="font-heading text-lg font-bold text-ink">Something went wrong</p>
      <p className="mt-2 break-words text-sm text-muted">
        {error.message || "Unexpected error."}
        {error.digest ? ` (ref ${error.digest})` : ""}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <a href="/admin" className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
