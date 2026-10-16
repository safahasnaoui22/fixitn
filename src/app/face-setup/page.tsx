"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Info, Loader2, ArrowLeft } from "lucide-react";
import { FaceCapture, preloadFaceModels } from "@/components/FaceCapture";
import { DARK_BG, ORANGE } from "@/lib/theme";
import { FaceIntro } from "@/components/FaceIntro";
import { faceLogoutAction } from "@/app/face-logout";

type Step = "intro" | "scanning" | "saving" | "done" | "error";

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

export default function FaceSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-create device token on mount so it's ready when needed
  useEffect(() => {
    getOrCreateDeviceToken();
    // start downloading the face models now, while the person reads the intro
    preloadFaceModels();
  }, []);

async function handleCapture(descriptor: number[]) {
  setStep("saving");
  setErrorMsg(null);

  try {
    const deviceToken = getOrCreateDeviceToken();

    const res = await fetch("/api/face/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descriptor, deviceToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Face already registered to another account
      if (data.code === "FACE_ALREADY_EXISTS") {
        setErrorMsg(data.error);
        setStep("error");
        return;
      }
      throw new Error(data.error ?? "Failed to save face data");
    }

    setStep("done");
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  } catch (err) {
    setErrorMsg(
      err instanceof Error ? err.message : "Something went wrong"
    );
    setStep("error");
  }
}

  function handleBack() {
    void faceLogoutAction();
  }

  // ── Intro step ──────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <FaceIntro
        title={
          <>
            Activez la reconnaissance{" "}
            <span style={{ color: ORANGE }}>faciale</span>
          </>
        }
        subtitle="Scannez votre visage une seule fois pour protéger votre compte, même si votre téléphone est perdu."
        startLabel="Démarrer la reconnaissance"
        onStart={() => setStep("scanning")}
        onBack={handleBack}
        footer={
          <p className="text-xs text-white/45">
            Seule une empreinte numérique de votre visage est enregistrée, jamais une photo.
          </p>
        }
      />
    );
  }

  // ── Scanning step ───────────────────────────────────────────────────
  if (step === "scanning") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col px-5 py-6 gap-5">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 self-start text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
            Retour à la connexion
          </button>
          <div className="text-center">
            <h1 className="font-heading text-xl font-bold text-white">
              Scan Your Face
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Look directly at the camera and press capture when your face
              is detected.
            </p>
          </div>

          <FaceCapture
            onCapture={handleCapture}
            captureLabel="Register My Face"
            threshold={0.5}
          />
        </div>
      </div>
    );
  }

  // ── Saving step ─────────────────────────────────────────────────────
  if (step === "saving") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Loader2 size={40} className="text-brand-orange animate-spin" />
          <p className="font-heading text-base font-semibold text-white">
            Saving your face data…
          </p>
          <p className="text-sm text-white/60 text-center">
            This only takes a second.
          </p>
        </div>
      </div>
    );
  }

  // ── Done step ────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Face ID Activated!
          </h1>
          <p className="text-[15px] text-white/60 leading-relaxed">
            Your account is now protected. You'll only need to verify your
            face when logging in from a new device.
          </p>
          <Loader2 size={20} className="text-white/60 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // ── Error step ───────────────────────────────────────────────────────
  return (
    <div className="app-content flex flex-col" style={{ background: DARK_BG }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-400/15">
          <ShieldCheck size={40} className="text-red-300" />
        </div>
        <h1 className="font-heading text-xl font-bold text-white">
          Setup Failed
        </h1>
        <p className="text-sm text-red-300 bg-red-400/15 px-4 py-3 rounded-xl w-full">
          {errorMsg}
        </p>
        <button
          onClick={() => {
            setErrorMsg(null);
            setStep("scanning");
          }}
          className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white"
        >
          Try Again
        </button>
        <button
          onClick={handleBack}
          className="w-full rounded-2xl border border-white/25 py-4 text-base font-semibold text-white"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}