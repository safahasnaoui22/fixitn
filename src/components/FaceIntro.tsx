
"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ScanFace,
  ShieldCheck,
  Zap,
  UserRound,
} from "lucide-react";
import { FaceCorners } from "@/components/FaceCorners";
import { ORANGE, NAVY_TILE } from "@/lib/theme";

export function FaceIntro({
  title,
  subtitle,
  startLabel,
  onStart,
  onBack,
  footer,
}: {
  title: ReactNode;
  subtitle: string;
  startLabel: string;
  onStart: () => void;
  onBack?: () => void;
  footer?: ReactNode;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const benefits = [
    { icon: ShieldCheck, text: "Sécurisé\net fiable" },
    { icon: Zap, text: "Accès rapide\net facile" },
    { icon: UserRound, text: "Votre visage,\nvotre compte" },
  ];

  return (
    <div
      className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden"
      style={{ backgroundColor: "#070B10" }}
    >
      {/* Soft orange glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(245,97,36,0.22) 0%, transparent 38%), radial-gradient(circle at 100% 100%, rgba(245,97,36,0.16) 0%, transparent 34%)",
        }}
      />

      {/* Main content: takes only the available phone height */}
      <div className="app-content no-scrollbar relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        {/* Back button */}
        <div className="flex h-9 shrink-0 items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center text-white"
            >
              <ArrowLeft size={22} className="rtl:rotate-180" />
            </button>
          ) : (
            <div className="h-9" />
          )}
        </div>

        {/* Logo */}
        <p className="font-heading mt-2 shrink-0 text-[30px] font-black leading-none tracking-tight text-white">
          fi<span style={{ color: ORANGE }}>x</span>ili
        </p>

        {/* Title and subtitle */}
        <h1 className="font-heading mt-4 shrink-0 text-[26px] font-bold leading-[1.12] text-white">
          {title}
        </h1>

        <p className="mt-2 max-w-[300px] shrink-0 text-[14px] leading-snug text-white/55">
          {subtitle}
        </p>

        {/* Face image: responsive size for short and tall phones */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-2">
          <div
            className="relative aspect-square w-full max-w-[min(250px,55vw)]"
            style={{
              maxHeight: "100%",
            }}
          >
            <FaceCorners length={46} thickness={4} radius={18} />

            <div
              className="absolute overflow-hidden rounded-full"
              style={{
                inset: 20,
                backgroundColor: NAVY_TILE,
                boxShadow:
                  "0 0 0 2px rgba(245,97,36,0.55), 0 0 30px rgba(245,97,36,0.30)",
              }}
            >
              {imgFailed ? (
                <div className="flex h-full w-full items-center justify-center">
                  <ScanFace size={72} style={{ color: ORANGE }} />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/face.png"
                  alt=""
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid shrink-0 grid-cols-3 gap-2 pb-1">
          {benefits.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: NAVY_TILE }}
              >
                <Icon
                  size={20}
                  style={{ color: ORANGE }}
                  strokeWidth={1.8}
                />
              </div>

              <p className="whitespace-pre-line text-[11px] leading-tight text-white/75">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom action: always visible within the phone viewport */}
      <div
        className="relative z-10 shrink-0 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
      >
        <button
          type="button"
          onClick={onStart}
          className="group relative flex h-[64px] w-full items-center gap-3 overflow-hidden rounded-[24px] pe-3 ps-3 text-white transition-transform active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, #FF7A3D 0%, #F56124 55%, #E24E12 100%)",
            boxShadow:
              "0 8px 24px rgba(245,97,36,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          {/* Shine */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.16), transparent)",
            }}
          />

          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <ScanFace size={25} strokeWidth={1.8} />
          </span>

          <span className="relative flex-1 text-start text-[16px] font-bold leading-tight">
            {startLabel}
          </span>

          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25">
            <ChevronRight
              size={21}
              strokeWidth={2.5}
              className="rtl:rotate-180"
            />
          </span>
        </button>

        {footer && (
          <div className="mt-2 text-center">{footer}</div>
        )}
      </div>
    </div>
  );
}
