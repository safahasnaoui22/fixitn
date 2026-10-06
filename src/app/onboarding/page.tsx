import Link from "next/link";
import {
  Droplets, Zap, Wrench, Home, Sparkles, ChevronRight, X,
} from "lucide-react";

export default function OnboardingPage() {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden"
      style={{ backgroundColor: "#050507" }}
    >
      {/* ── Full-screen background image ────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fixili-background.jpeg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
        style={{ opacity: 0.95 }}
      />

      {/* ── Subtle dark overlay to deepen contrast ─────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* ── Top-left X button ──────────────────────────────────────── */}
      <div className="relative z-10 flex items-start justify-start px-5 pt-14">
        <Link
          href="/login"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "rgba(249,115,22,0.25)",
            border: "1.5px solid #F97316",
          }}
          aria-label="Skip"
        >
          <X size={18} color="#F97316" strokeWidth={3} />
        </Link>
      </div>

      {/* ── Main content — centered between the two curves ─────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-7 py-6">

        {/* fixili wordmark */}
        <div className="mb-5 text-center">
          <h1
            className="font-heading font-black leading-none tracking-tight text-white"
            style={{
              fontSize: "clamp(64px, 20vw, 88px)",
              letterSpacing: "-0.03em",
            }}
          >
            fi<span style={{ color: "#F97316" }}>x</span>ili
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="mb-8 text-center font-medium leading-snug"
          style={{
            color: "rgba(255,255,255,0.70)",
            fontSize: "clamp(15px, 4.5vw, 18px)",
          }}
        >
          Des pros, pour tous<br />vos travaux.
        </p>

        {/* Service icons */}
        <div className="mb-12 flex items-center justify-center gap-7">
          {[
            { icon: Droplets, label: "Plomberie" },
            { icon: Zap,      label: "Électricité" },
            { icon: Wrench,   label: "Réparation" },
            { icon: Home,     label: "Maison" },
            { icon: Sparkles, label: "Nettoyage" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Icon
                size={22}
                color="rgba(255,255,255,0.65)"
                strokeWidth={1.5}
              />
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-8 w-full max-w-[320px] flex flex-col gap-3">
          {/* Primary — Commencer */}
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-bold text-white"
            style={{
              background: "#F97316",
              boxShadow:
                "0 0 32px rgba(249,115,22,0.5), 0 4px 16px rgba(249,115,22,0.3)",
              letterSpacing: "0.01em",
            }}
          >
            Commencer
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>

          {/* Secondary — Already have account */}
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold"
            style={{
              color: "rgba(255,255,255,0.60)",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>

      {/* ── Bottom tagline ─────────────────────────────────────────── */}
      <div className="relative z-10 pb-10 text-center">
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}
        >
          Votre maison, entre de bonnes mains.
        </p>
      </div>
    </div>
  );
}