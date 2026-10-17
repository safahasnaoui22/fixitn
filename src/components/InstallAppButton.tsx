"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, MoreVertical } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
declare global {
  interface Window {
    __fixiliInstall?: InstallEvent | null;
  }
}

/**
 * "Installer l'application" button (PWA) for the login page.
 * - Android / Chrome / Edge: opens the real install popup.
 * - iPhone (Safari) or browsers without the popup: shows 2-3 simple steps.
 * - Hidden when the app is already installed (opened from the home screen).
 * The install event is captured by <InstallPrompt/> in the layout (it can fire
 * before this page is shown) and shared through window.__fixiliInstall.
 */
export function InstallAppButton() {
  const t = useT();
  const [installed, setInstalled] = useState(true); // hidden until we know
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setEvt(window.__fixiliInstall ?? null);

    const onReady = () => setEvt(window.__fixiliInstall ?? null);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("fixili-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("fixili-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function click() {
    if (evt) {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      window.__fixiliInstall = null;
      setEvt(null);
      if (outcome === "accepted") setInstalled(true);
      return;
    }
    setHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={click}
        className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition active:scale-[0.98]"
      >
        <Download size={16} className="text-brand-orange" />
        {t("install.button")}
      </button>

      {help && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4"
          onClick={() => setHelp(false)}
        >
          <div
            className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#121C26] p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-heading text-base font-bold">{t("install.title")}</p>
              <button onClick={() => setHelp(false)} aria-label="Close" className="text-white/60">
                <X size={18} />
              </button>
            </div>
            {ios ? (
              <ol className="mt-3 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  1. {t("install.iosStep1")} <Share size={16} className="text-brand-orange" />
                </li>
                <li>2. {t("install.iosStep2")}</li>
                <li>3. {t("install.iosStep3")}</li>
              </ol>
            ) : (
              <ol className="mt-3 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  1. {t("install.otherStep1")} <MoreVertical size={16} className="text-brand-orange" />
                </li>
                <li>2. {t("install.otherStep2")}</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
