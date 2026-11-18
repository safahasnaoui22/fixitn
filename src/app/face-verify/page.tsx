"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  HelpCircle,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { FaceCapture, preloadFaceModels } from "@/components/FaceCapture";
import { DARK_BG } from "@/lib/theme";
import { FaceIntro } from "@/components/FaceIntro";
import { AccentTitle } from "@/components/AccentTitle";
import { useT } from "@/lib/i18n/I18nProvider";
import { faceLogoutAction } from "@/app/face-logout";
import { Button } from "@/components/ui/Button";

type Step = "intro" | "scanning" | "verifying" | "success" | "error" | "support";

const DEVICE_TOKEN_KEY = "fixitn_device";

function getOrCreateDeviceToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export default function FaceVerifyPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    getOrCreateDeviceToken();
    // start downloading the face models now, while the person reads the intro
    preloadFaceModels();
  }, []);

  async function handleCapture(descriptor: number[]) {
    setStep("verifying");
    setErrorMsg(null);

    try {
      const deviceToken = getOrCreateDeviceToken();

      const res = await fetch("/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor, deviceToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setStep("support");
          return;
        }

        setErrorMsg(
          data.error ?? t("auth.face.verify.fail")
        );
        setStep("error");
        return;
      }

      // Save the new device token to localStorage so next login
      // from this device is recognised as known
      localStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken ?? deviceToken);

      setStep("success");

      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1500);
    } catch {
      setAttempts((a) => a + 1);
      setErrorMsg(t("auth.face.verify.network"));
      setStep("error");
    }
  }

  function handleLogout() {
    void faceLogoutAction();
  }

  // ── Intro ────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <FaceIntro
        title={<AccentTitle text={t("face.verifyTitle")} />}
        subtitle={t("face.verifySubtitle")}
        startLabel={t("face.start")}
        onStart={() => setStep("scanning")}
        onBack={handleLogout}
        footer={
          <p className="text-xs text-white/45">
            {t("face.verifyFooter")}
          </p>
        }
      />
    );
  }

  // ── Scanning ─────────────────────────────────────────────────────────
  if (step === "scanning" || step === "error") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col px-5 py-6 gap-5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 self-start text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
            {t("face.backToLogin")}
          </button>
          <div className="text-center">
            <h1 className="font-heading text-xl font-bold text-white">
              {t("auth.face.verify.scanTitle")}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {t("auth.face.verify.scanText")}
            </p>
            {attempts > 0 && (
              <p className="mt-1.5 text-xs text-amber-300 font-medium">
                {t("auth.face.verify.attempt", { n: attempts, max: MAX_ATTEMPTS })}
              </p>
            )}
          </div>

          {step === "error" && errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-400/15 px-4 py-3">
              <AlertCircle size={16} className="text-red-300 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errorMsg}</p>
            </div>
          )}

          <FaceCapture
            onCapture={handleCapture}
            captureLabel={t("auth.face.verify.captureLabel")}
            threshold={0.5}
            autoCapture={step === "scanning"}
          />

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setStep("support")}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors mx-auto"
            >
              <HelpCircle size={13} />
              {t("auth.face.verify.help")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Verifying ────────────────────────────────────────────────────────
  if (step === "verifying") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Loader2
            size={48}
            className="text-brand-orange animate-spin"
          />
          <p className="font-heading text-base font-semibold text-white">
            {t("auth.face.verify.verifying")}
          </p>
          <p className="text-sm text-white/60 text-center">
            {t("auth.face.verify.verifyingSub")}
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            {t("auth.face.verify.okTitle")}
          </h1>
          <p className="text-[15px] text-white/60 leading-relaxed">
            {t("auth.face.verify.okText")}
          </p>
          <Loader2 size={20} className="text-white/60 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // ── Support / too many attempts ──────────────────────────────────────
  return (
    <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/15">
          <HelpCircle size={40} className="text-amber-300" />
        </div>

        <h1 className="font-heading text-xl font-bold text-white">
          {attempts >= MAX_ATTEMPTS
            ? t("auth.face.verify.tooMany")
            : t("auth.face.verify.needHelp")}
        </h1>

        <p className="text-[15px] text-white/60 leading-relaxed">
          {attempts >= MAX_ATTEMPTS
            ? t("auth.face.verify.tooManyText")
            : t("auth.face.verify.helpText")}
        </p>

        <div className="w-full rounded-2xl bg-white/5 p-4 text-start flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">{t("auth.face.verify.tipsTitle")}</p>
          {[1, 2, 3, 4, 5].map((n) => t(`auth.face.verify.tip${n}`)).map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-brand-orange font-bold text-xs mt-0.5">•</span>
              <p className="text-sm text-white/60">{tip}</p>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col gap-3">
          {attempts < MAX_ATTEMPTS && (
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                setErrorMsg(null);
                setStep("scanning");
              }}
            >
              {t("common.retry")}
            </Button>
          )}

          <a
            href={`mailto:support@fixitn.tn?subject=${encodeURIComponent(t("auth.face.verify.mailSubject"))}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 text-sm font-semibold text-white"
          >
            <HelpCircle size={16} className="text-white/60" />
            {t("auth.face.verify.contact")}
          </a>

          <Button
            fullWidth
            size="lg"
            variant="outline"
              className="border-white/25 text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {t("auth.face.verify.logout")}
          </Button>
        </div>

        <p className="text-xs text-white/60 px-2">
          {t("auth.face.verify.compromised")}{" "}
          <span dir="ltr" className="text-brand-orange font-medium">
            support@fixitn.tn
          </span>
        </p>
      </div>
    </div>
  );
}