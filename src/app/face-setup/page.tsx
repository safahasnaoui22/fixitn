"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Info, Loader2 } from "lucide-react";
import { FaceCapture } from "@/components/FaceCapture";

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
        throw new Error(data.error ?? "Failed to save face data");
      }

      // Server re-issues the JWT with faceSetup:true + deviceVerified:true
      // The cookie is set — now we just redirect
      setStep("done");

      // Small delay so the success state is visible
      setTimeout(() => {
        router.replace("/");
        router.refresh(); // force middleware re-evaluation
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  // ── Intro step ──────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange-light">
            <ShieldCheck size={40} className="text-brand-orange" />
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">
              Set Up Face ID
            </h1>
            <p className="mt-2 text-[15px] text-muted leading-relaxed">
              FixiTN uses face recognition to keep your account secure.
              Your face scan is required once — it protects your account
              if your phone is ever lost or stolen.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-line bg-surface-alt p-4 text-left flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">How it works</p>
            {[
              "We scan your face once and save a mathematical fingerprint (not a photo)",
              "If you log in from a new device, we'll verify your face before granting access",
              "Your face data is never shared or sent to any third party",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange-light text-[11px] font-bold text-brand-orange mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-left w-full">
            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Only your face's 128-number mathematical descriptor is stored —
              it is impossible to reconstruct a photo from it.
            </p>
          </div>

          <button
            onClick={() => setStep("scanning")}
            className="w-full rounded-2xl bg-brand-orange py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
          >
            Start Face Setup
          </button>

          <p className="text-xs text-muted">
            Make sure you are in a well-lit room before continuing.
          </p>
        </div>
      </div>
    );
  }

  // ── Scanning step ───────────────────────────────────────────────────
  if (step === "scanning") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col px-5 py-6 gap-5">
          <div className="text-center">
            <h1 className="font-heading text-xl font-bold text-ink">
              Scan Your Face
            </h1>
            <p className="mt-1 text-sm text-muted">
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
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Loader2 size={40} className="text-brand-orange animate-spin" />
          <p className="font-heading text-base font-semibold text-ink">
            Saving your face data…
          </p>
          <p className="text-sm text-muted text-center">
            This only takes a second.
          </p>
        </div>
      </div>
    );
  }

  // ── Done step ────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
            <ShieldCheck size={40} className="text-success" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Face ID Activated!
          </h1>
          <p className="text-[15px] text-muted leading-relaxed">
            Your account is now protected. You'll only need to verify your
            face when logging in from a new device.
          </p>
          <Loader2 size={20} className="text-muted animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // ── Error step ───────────────────────────────────────────────────────
  return (
    <div className="app-content flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-light">
          <ShieldCheck size={40} className="text-danger" />
        </div>
        <h1 className="font-heading text-xl font-bold text-ink">
          Setup Failed
        </h1>
        <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl w-full">
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
      </div>
    </div>
  );
}