"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, ScanFace, ShieldCheck, Zap, UserRound } from "lucide-react";
import { FaceCorners } from "@/components/FaceCorners";
import { ORANGE, NAVY_TILE } from "@/lib/theme";

// Intro screen of the Face ID pages (setup + verify), same look as the mockup:
// back arrow, wordmark, big title, picture in a glowing circle with orange
// corners, three small benefits and an orange "start" button.
// The picture is public/face.png.
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
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: "#070B10" }}
    >
      {/* soft orange glows in two corners */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(245,97,36,0.22) 0%, transparent 38%), radial-gradient(circle at 100% 100%, rgba(245,97,36,0.16) 0%, transparent 34%)",
        }}
      />

      <div className="app-content no-scrollbar relative z-10 flex flex-col px-6 pb-8 pt-8">
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

        <p className="font-heading mt-4 text-[34px] font-black leading-none tracking-tight text-white">
          fi<span style={{ color: ORANGE }}>x</span>ili
        </p>

        <h1 className="font-heading mt-6 text-[28px] font-bold leading-[1.15] text-white">
          {title}
        </h1>
        <p className="mt-3 max-w-[300px] text-[15px] leading-snug text-white/55">{subtitle}</p>

        {/* Picture in a glowing circle + orange corners */}
        <div className="mt-8 flex justify-center">
          <div className="relative" style={{ width: 270, height: 270 }}>
            <FaceCorners length={52} thickness={4} radius={20} />
            <div
              className="absolute overflow-hidden rounded-full"
              style={{
                inset: 22,
                backgroundColor: NAVY_TILE,
                boxShadow: "0 0 0 2px rgba(245,97,36,0.55), 0 0 40px rgba(245,97,36,0.35)",
              }}
            >
              {imgFailed ? (
                <div className="flex h-full w-full items-center justify-center">
                  <ScanFace size={80} style={{ color: ORANGE }} />
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
        <div className="mt-9 grid grid-cols-3 gap-2">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2.5 text-center">
              <div
                className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl"
                style={{ backgroundColor: NAVY_TILE }}
              >
                <Icon size={22} style={{ color: ORANGE }} strokeWidth={1.8} />
              </div>
              <p className="whitespace-pre-line text-[12.5px] leading-tight text-white/75">{text}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-10 flex h-[60px] w-full items-center justify-center gap-3 rounded-full text-[17px] font-semibold text-white transition-transform active:scale-[0.98]"
          style={{ backgroundColor: ORANGE, boxShadow: "0 8px 30px rgba(245,97,36,0.35)" }}
        >
          <ScanFace size={24} strokeWidth={1.8} />
          <span className="flex-1 text-start">{startLabel}</span>
          <ChevronRight size={20} className="rtl:rotate-180" />
        </button>

        {footer && <div className="mt-5 text-center">{footer}</div>}
      </div>
    </div>
  );
}
