"use client";

import Link from "next/link";
import { Star, CalendarDays } from "lucide-react";
import { NAVY_ROW, ORANGE } from "@/lib/theme";
import { DefaultAvatar } from "@/components/ui/DefaultAvatar";
import type { HomeTechnician } from "@/lib/db/homeTechnicians";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDT } from "@/lib/utils";

const AVAILABILITY_BADGE: Record<
  HomeTechnician["availability"],
  { label: string; bg: string; fg: string; dot: string }
> = {
  AVAILABLE: { label: "comp.tech.available", bg: "#16a34a", fg: "#fff", dot: "#fff" },
  BUSY: { label: "comp.tech.busy", bg: ORANGE, fg: "#fff", dot: "#fff" },
  OFFLINE: { label: "comp.tech.offline", bg: "rgba(9,18,25,0.85)", fg: "rgba(255,255,255,0.65)", dot: "#7b8794" },
};

/**
 * Slider card of a technician: photo, Dispo / En mission / Hors ligne, name, stars,
 * years of experience and starting price. The whole card opens his profile.
 */
export function HomeTechnicianCard({
  tech,
  categorySlug,
  width = 158,
}: {
  tech: HomeTechnician;
  categorySlug?: string;
  width?: number | string;
}) {
  const { t, locale } = useI18n();
  const badge = AVAILABILITY_BADGE[tech.availability];
  const [fromBefore, fromAfter = ""] = t("comp.tech.startingFrom").split("{price}");
  const href = `/technician/${tech.id}${categorySlug ? `?category=${categorySlug}` : ""}`;

  return (
    <Link
      href={href}
      className="group shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.07] transition-transform active:scale-[0.97]"
      style={{ width, backgroundColor: NAVY_ROW }}
    >
      <div className="relative h-[104px] w-full overflow-hidden bg-[#162434]">
        {tech.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tech.avatarUrl}
            alt={tech.fullName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <DefaultAvatar name={tech.fullName} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Dispo / En mission / Hors ligne */}
        <span
          className="absolute end-2 top-2 flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-bold"
          style={{ backgroundColor: badge.bg, color: badge.fg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
          {t(badge.label)}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-2.5 pb-2.5 pt-2">
        <p className="truncate font-heading text-[13px] font-semibold text-white">{tech.fullName}</p>

        <div className="flex items-center gap-1 text-[11px]">
          <Star size={12} className="fill-star text-star" />
          {tech.ratingAvg != null ? (
            <>
              <span className="font-semibold text-white">{tech.ratingAvg.toFixed(1)}</span>
              <span className="text-white/50">{t("comp.tech.reviews", { n: tech.ratingCount })}</span>
            </>
          ) : (
            <span className="text-white/50">{t("comp.tech.new")}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-white/55">
          <CalendarDays size={12} />
          <span className="truncate">
            {t(tech.yearsExperience > 1 ? "comp.tech.yearsMany" : "comp.tech.yearsOne", { n: tech.yearsExperience })}
          </span>
        </div>

        <p className="mt-0.5 text-end text-[10.5px] text-white/50">
          {fromBefore}
          <span className="font-semibold" style={{ color: ORANGE }}>
            {formatDT(tech.startingPrice, locale)}
          </span>
          {fromAfter}
        </p>
      </div>
    </Link>
  );
}
