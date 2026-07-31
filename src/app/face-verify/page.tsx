"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { FaceCapture } from "@/components/FaceCapture";
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
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    getOrCreateDeviceToken();
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
          data.error ??
            "Face verification failed. Please try again."
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
      setErrorMsg("Network error. Check your connection and try again.");
      setStep("error");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  // ── Intro ────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange-light">
            <ShieldCheck size={40} className="text-brand-orange" />
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">
              Verify Your Identity
            </h1>
            <p className="mt-2 text-[15px] text-muted leading-relaxed">
              We don&apos;t recognise this device. For your security,
              please verify your face before we grant access to your account.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Why am I seeing this?
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              You are logging in from a new or unrecognised device. This
              check ensures that only you can access your account — even if
              someone else knows your password.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Button
              fullWidth
              size="lg"
              onClick={() => setStep("scanning")}
            >
              <ShieldCheck size={18} />
              Verify My Face
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Cancel &amp; Log Out
            </Button>
          </div>

          <p className="text-xs text-muted px-2">
            Make sure you are in a well-lit room. The same face you
            registered during signup must be visible.
          </p>
        </div>
      </div>
    );
  }

  // ── Scanning ─────────────────────────────────────────────────────────
  if (step === "scanning" || step === "error") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col px-5 py-6 gap-5">
          <div className="text-center">
            <h1 className="font-heading text-xl font-bold text-ink">
              Face Verification
            </h1>
            <p className="mt-1 text-sm text-muted">
              Look directly at the camera and press verify.
            </p>
            {attempts > 0 && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                Attempt {attempts} of {MAX_ATTEMPTS}
              </p>
            )}
          </div>

          {step === "error" && errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-danger-light px-4 py-3">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{errorMsg}</p>
            </div>
          )}

          <FaceCapture
            onCapture={handleCapture}
            captureLabel="Verify My Face"
            threshold={0.5}
          />

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setStep("support")}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mx-auto"
            >
              <HelpCircle size={13} />
              Having trouble? Get help
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Verifying ────────────────────────────────────────────────────────
  if (step === "verifying") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Loader2
            size={48}
            className="text-brand-orange animate-spin"
          />
          <p className="font-heading text-base font-semibold text-ink">
            Verifying your identity…
          </p>
          <p className="text-sm text-muted text-center">
            Comparing face with your registered data.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="app-content flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
            <ShieldCheck size={40} className="text-success" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            Identity Verified!
          </h1>
          <p className="text-[15px] text-muted leading-relaxed">
            Welcome back. This device is now trusted and you won&apos;t
            need to verify again from it.
          </p>
          <Loader2 size={20} className="text-muted animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // ── Support / too many attempts ──────────────────────────────────────
  return (
    <div className="app-content flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <HelpCircle size={40} className="text-amber-500" />
        </div>

        <h1 className="font-heading text-xl font-bold text-ink">
          {attempts >= MAX_ATTEMPTS
            ? "Too Many Failed Attempts"
            : "Need Help?"}
        </h1>

        <p className="text-[15px] text-muted leading-relaxed">
          {attempts >= MAX_ATTEMPTS
            ? "You've exceeded the maximum number of verification attempts."
            : "If you're having trouble verifying your face, here's what you can do."}
        </p>

        <div className="w-full rounded-2xl border border-line bg-surface p-4 text-left flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">Tips to fix this</p>
          {[
            "Move to a brighter room or face a window",
            "Remove glasses, hat or anything covering your face",
            "Hold the phone at eye level, not from below",
            "Make sure the camera lens is clean",
            "Try using the same expression as when you registered",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-brand-orange font-bold text-xs mt-0.5">•</span>
              <p className="text-sm text-muted">{tip}</p>
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
              Try Again
            </Button>
          )}

          <a
            href="mailto:support@fixitn.tn?subject=Face verification issue"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-4 text-sm font-semibold text-ink"
          >
            <HelpCircle size={16} className="text-muted" />
            Contact Support
          </a>

          <Button
            fullWidth
            size="lg"
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Log Out
          </Button>
        </div>

        <p className="text-xs text-muted px-2">
          If you believe your account has been compromised or you cannot
          verify your identity, contact us at{" "}
          <span className="text-brand-orange font-medium">
            support@fixitn.tn
          </span>
        </p>
      </div>
    </div>
  );
}