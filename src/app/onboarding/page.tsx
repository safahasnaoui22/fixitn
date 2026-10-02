import Link from "next/link";
import {
  Droplets, Zap, Wrench, Home, Sparkles, ChevronRight,
} from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden px-6 py-10"
      style={{ backgroundColor: "#0D0F1A" }}>

      {/* Orange glow — bottom center */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "90vw",
          height: "55vh",
          background:
            "radial-gradient(ellipse at center bottom, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Top spacer */}
      <div />

      {/* Center block */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs">

        {/* Brand name */}
        <div className="flex flex-col items-center gap-3">
          {/* Logo mark */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-2"
            style={{ background: "rgba(249,115,22,0.15)", border: "1.5px solid rgba(249,115,22,0.25)" }}>
            <Wrench size={32} className="text-orange-500" />
          </div>

          {/* fixili wordmark */}
          <div className="relative">
            <span
              className="font-heading font-bold tracking-tight"
              style={{
                fontSize: "clamp(52px, 16vw, 72px)",
                color: "#ffffff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              f<span style={{ color: "#F97316" }}>i</span>x
              <span style={{ color: "#F97316" }}>i</span>l
              <span style={{ color: "#F97316" }}>i</span>
            </span>
          </div>

          {/* Tagline */}
          <p
            className="text-center text-base font-medium"
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}
          >
            Des pros, pour tous<br />vos travaux.
          </p>
        </div>

        {/* Service icons row */}
        <div className="flex items-center justify-center gap-5">
          {[
            { icon: Droplets,  label: "Plomberie" },
            { icon: Zap,       label: "Électricité" },
            { icon: Wrench,    label: "Réparation" },
            { icon: Home,      label: "Maison" },
            { icon: Sparkles,  label: "Nettoyage" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}
              >
                <Icon size={18} style={{ color: "#F97316" }} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex w-full flex-col gap-3 mt-2">
          {/* Primary — Commencer */}
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #EA6B10 100%)",
              boxShadow: "0 4px 24px rgba(249,115,22,0.4)",
            }}
          >
            Commencer
            <ChevronRight size={18} />
          </Link>

          {/* Secondary — Already have account */}
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl py-4 text-sm font-semibold transition-all active:scale-[0.97]"
            style={{
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>

      {/* Bottom tagline */}
      <p
        className="relative z-10 text-center text-xs tracking-wide"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Votre maison, entre de bonnes mains.
      </p>
    </div>
  );
}