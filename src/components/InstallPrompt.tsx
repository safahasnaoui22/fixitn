"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Share } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useT();
  const [androidPrompt, setAndroidPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      // shared with the "Installer l'application" button of the login page
      (window as unknown as { __fixiliInstall?: Event }).__fixiliInstall = e;
      window.dispatchEvent(new Event("fixili-install-ready"));
      setAndroidPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    if (isIos && isSafari) setShowIos(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismissed0 = typeof window !== "undefined" && !!localStorage.getItem("install-dismissed");
  const dismiss = () => {
    setDismissed(true);
    setAndroidPrompt(null);
    setShowIos(false);
    localStorage.setItem("install-dismissed", "1");
  };

  const handleAndroidInstall = async () => {
    if (!androidPrompt) return;
    await androidPrompt.prompt();
    const { outcome } = await androidPrompt.userChoice;
    if (outcome === "accepted") setAndroidPrompt(null);
    else dismiss();
  };

  // the login page has its own install button
  if (dismissed || dismissed0 || pathname.startsWith("/login")) return null;

  // Android install banner
  if (androidPrompt) {
    return (
      <div className="fixed bottom-24 inset-x-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-brand-navy p-4 text-white shadow-2xl animate-fade-up">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange">
          <Download size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t("comp.install.bannerTitle")}</p>
          <p className="text-xs text-white/60">{t("comp.install.bannerText")}</p>
        </div>
        <button onClick={handleAndroidInstall}
          className="shrink-0 rounded-xl bg-brand-orange px-3 py-1.5 text-xs font-bold">
          {t("comp.install.bannerButton")}
        </button>
        <button onClick={dismiss} aria-label={t("common.close")} className="text-white/40 hover:text-white">
          <X size={16} />
        </button>
      </div>
    );
  }

  // iOS install hint
  if (showIos) {
    return (
      <div className="fixed bottom-24 inset-x-4 z-50 mx-auto max-w-sm rounded-2xl bg-brand-navy p-4 text-white shadow-2xl animate-fade-up">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold">{t("comp.install.iosTitle")}</p>
          <button onClick={dismiss} aria-label={t("common.close")} className="text-white/40"><X size={16} /></button>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {t("comp.install.iosHint")
            .split(/(\{share\}|\{add\})/)
            .map((part, i) =>
              part === "{share}" ? (
                <Share key={i} size={12} className="inline mx-1" />
              ) : part === "{add}" ? (
                <strong key={i} className="text-white">{t("comp.install.addToHome")}</strong>
              ) : (
                part
              )
            )}
        </p>
      </div>
    );
  }

  return null;
}