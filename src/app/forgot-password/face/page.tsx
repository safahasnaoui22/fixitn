"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { FaceCapture } from "@/components/FaceCapture";

type Step = "phone" | "scanning" | "verifying" | "reset" | "done" | "error";

export default function FacePasswordResetPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [loading, setLoading]       = useState(false);

  // Step 1 — enter phone to find account
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    if (!phone.trim()) {
      setPhoneError("Veuillez saisir votre numéro de téléphone.");
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
      setErrorMsg(data.error ?? "Visage non reconnu.");
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
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
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
      setErrorMsg(data.error ?? "Erreur. Réessayez.");
      return;
    }

    setStep("done");
    setTimeout(() => {
      router.replace(
        `/login?success=${encodeURIComponent(
          "Mot de passe réinitialisé avec succès !"
        )}`
      );
    }, 2000);
  }

  // ── Phone step ─────────────────────────────────────────────────────
  if (step === "phone") {
    return (
      <div className="app-content px-6 py-8">
        <Link href="/forgot-password" className="flex items-center gap-1.5 text-sm text-muted">
          <ArrowLeft size={15} /> Retour
        </Link>
        <h1 className="font-heading mt-8 text-2xl font-bold text-ink">
          Entrez votre numéro
        </h1>
        <p className="mt-1 text-sm text-muted">
          Nous allons vérifier votre visage pour confirmer votre identité.
        </p>
        <form onSubmit={handlePhoneSubmit} className="mt-8 flex flex-col gap-4">
          {phoneError && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {phoneError}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-ink">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="2XXXXXXX"
              required
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
          >
            Continuer
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
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-heading text-xl font-bold text-ink">
            Vérification du visage
          </h1>
        </div>
        <p className="text-sm text-muted text-center">
          Regardez la caméra — votre visage doit correspondre au compte{" "}
          <span className="font-semibold text-ink">{phone}</span>
        </p>
        {step === "error" && errorMsg && (
          <div className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger text-center">
            {errorMsg}
          </div>
        )}
        <FaceCapture
          onCapture={handleCapture}
          captureLabel="Vérifier mon visage"
          threshold={0.5}
        />
      </div>
    );
  }

  // ── Verifying step ─────────────────────────────────────────────────
  if (step === "verifying") {
    return (
      <div className="app-content flex flex-col items-center justify-center gap-4 px-6">
        <Loader2 size={40} className="text-brand-orange animate-spin" />
        <p className="font-heading text-base font-semibold text-ink">
          Vérification en cours…
        </p>
      </div>
    );
  }

  // ── Reset password step ────────────────────────────────────────────
  if (step === "reset") {
    return (
      <div className="app-content px-6 py-8">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-success font-medium">
          ✓ Identité confirmée
        </p>
        <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4">
          {errorMsg && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {errorMsg}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-ink">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 caractères"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Répétez le mot de passe"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-brand-orange"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {loading ? "Enregistrement…" : "Réinitialiser le mot de passe"}
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
        Mot de passe réinitialisé !
      </h1>
      <p className="text-sm text-muted">Redirection vers la connexion…</p>
      <Loader2 size={20} className="text-muted animate-spin" />
    </div>
  );
}