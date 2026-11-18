"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/I18nProvider";

// Without an error boundary, any crash on /register shows a blank white page.
export default function RegisterError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("[register] crashed:", error);
  }, [error]);

  return (
    <div className="app-content px-6 py-10 text-center">
      <h2 className="font-heading text-lg font-bold text-ink">{t("auth.register.crash.title")}</h2>
      <p className="mt-2 text-sm text-muted">
        {t("auth.register.crash.text")}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-6 h-12 w-full rounded-xl bg-brand-orange px-5 text-[15px] font-semibold text-white"
      >
        {t("auth.register.crash.retry")}
      </button>
      <Link href="/onboarding" className="mt-4 block text-sm text-muted">
        <span className="inline-block rtl:rotate-180">&larr;</span> {t("common.back")}
      </Link>
    </div>
  );
}