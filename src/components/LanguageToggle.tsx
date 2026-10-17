"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** FR | EN | عربي — saves the choice in a cookie and refreshes the page. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(l: Locale) {
    if (l === locale) return;
    start(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  }

  return (
    <div
      dir="ltr"
      className={`inline-flex items-center gap-0.5 rounded-full border border-white/20 bg-black/30 p-0.5 backdrop-blur ${pending ? "opacity-60" : ""} ${className}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
            l === locale ? "bg-brand-orange text-white" : "text-white/70"
          }`}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
