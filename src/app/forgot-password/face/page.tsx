"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { FaceCapture, preloadFaceModels } from "@/components/FaceCapture";
import { DARK_BG } from "@/lib/theme";
import { useT } from "@/lib/i18n/I18nProvider";

type Step = "phone" | "scanning" | "verifying" | "reset" | "done" | "error";

export default function FacePasswordResetPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [loading, setLoading]       = useState(false);

  // download the face models while the person types the phone number
  useEffect(() => {
    preloadFaceModels();
  }, []);

  // Step 1 — enter phone to find account
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    if (!phone.trim()) {
      setPhoneError(t("auth.forgot.phoneRequired"));
      return;
    }
    setStep("scanning");
  }

  // Step 2 — face captured
  async function handleCapture(desc: number[]) {
    setDescriptor(desc);
    setStep("verifying");
    setErrorMsg("");

    // Verify face matches the phone's stored descriptor
    const res = await fetch("/api/face/reset-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), descriptor: desc }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? t("auth.forgot.err.notRecognized"));
      setStep("error");
      return;
    }

    // Face matches — show password reset form
    setStep("reset");
  }

  // Step 3 — new password submission
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg(t("auth.forgot.err.passMin"));
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t("auth.forgot.err.mismatch"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/face/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim(),
        descriptor,
        newPassword: password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.error ?? t("auth.forgot.err.generic"));
      return;
    }

    setStep("done");
    setTimeout(() => {
      router.replace(
        `/login?success=${encodeURIComponent(t("auth.forgot.success"))}`
      );
    }, 2000);
  }

  // ── Phone step ─────────────────────────────────────────────────────
  if (step === "phone") {
    return (
      <div className="app-content px-6 py-8">
        <Link href="/forgot-password" className="flex items-center gap-1.5 text-sm text-muted">
          <ArrowLeft size={15} className="rtl:rotate-180" /> {t("forgot.back")}
        </Link>
        <h1 className="font-heading mt-8 text-2xl font-bold text-ink">
          {t("auth.forgot.phoneTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("auth.forgot.phoneText")}
        </p>
        <form onSubmit={handlePhoneSubmit} className="mt-8 flex flex-col gap-4">
          {phoneError && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {phoneError}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-ink">
              {t("login.phone")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("auth.phonePlaceholder")}
              required
              dir="ltr"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
          >
            {t("auth.forgot.continue")}
          </button>
        </form>
      </div>
    );
  }

  // ── Scanning step ──────────────────────────────────────────────────
  if (step === "scanning" || step === "error") {
    return (
      <div className="app-content flex flex-col px-5 py-6 gap-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("phone")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </button>
          <h1 className="font-heading text-xl font-bold text-ink">
            {t("auth.forgot.faceTitle")}
          </h1>
        </div>
        <p className="text-sm text-muted text-center">
          {t("auth.forgot.faceText", { phone })}
        </p>
        {step === "error" && errorMsg && (
          <div className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger text-center">
            {errorMsg}
          </div>
        )}
        <div className="rounded-3xl px-4 py-6" style={{ background: DARK_BG }}>
          <FaceCapture
            onCapture={handleCapture}
            captureLabel={t("forgot.verify")}
            threshold={0.5}
          />
        </div>
      </div>
    );
  }

  // ── Verifying step ─────────────────────────────────────────────────
  if (step === "verifying") {
    return (
      <div className="app-content flex flex-col items-center justify-center gap-4 px-6">
        <Loader2 size={40} className="text-brand-orange animate-spin" />
        <p className="font-heading text-base font-semibold text-ink">
          {t("auth.forgot.verifying")}
        </p>
      </div>
    );
  }

  // ── Reset password step ────────────────────────────────────────────
  if (step === "reset") {
    return (
      <div className="app-content px-6 py-8">
        <h1 className="font-heading text-2xl font-bold text-ink">
          {t("auth.forgot.newPassTitle")}
        </h1>
        <p className="mt-1 text-sm text-success font-medium">
          {t("auth.forgot.confirmed")}
        </p>
        <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4">
          {errorMsg && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {errorMsg}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-ink">
              {t("auth.forgot.newPassTitle")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={t("auth.forgot.passPlaceholder")}
              dir="ltr"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">
              {t("auth.forgot.confirmLabel")}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder={t("auth.forgot.confirmPlaceholder")}
              dir="ltr"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {loading ? t("auth.forgot.saving") : t("auth.forgot.resetBtn")}
          </button>
        </form>
      </div>
    );
  }

  // ── Done step ──────────────────────────────────────────────────────
  return (
    <div className="app-content flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
        <ShieldCheck size={40} className="text-success" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-ink">
        {t("auth.forgot.doneTitle")}
      </h1>
      <p className="text-sm text-muted">{t("auth.forgot.redirecting")}</p>
      <Loader2 size={20} className="text-muted animate-spin" />
    </div>
  );
}