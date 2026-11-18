"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/I18nProvider";

/** Shows a readable error inside the admin panel instead of a blank page. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
      <p className="font-heading text-lg font-bold text-ink">{t("admin.error.title")}</p>
      <p className="mt-2 break-words text-sm text-muted">
        {error.message || t("admin.error.unexpected")}
        {error.digest ? ` (${t("admin.error.ref")} ${error.digest})` : ""}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
        >
          {t("common.retry")}
        </button>
        <a href="/admin" className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink">
          {t("admin.error.backToDashboard")}
        </a>
      </div>
    </div>
  );
}
