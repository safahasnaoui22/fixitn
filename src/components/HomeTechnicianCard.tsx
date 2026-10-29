import Link from "next/link";
import { Star, CalendarDays } from "lucide-react";
import { NAVY_ROW, ORANGE } from "@/lib/theme";
import { initials } from "@/lib/utils";
import type { HomeTechnician } from "@/lib/db/homeTechnicians";

/**
 * Slider card of a technician: photo, En ligne / Hors ligne, name, stars,
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1B2C4F] to-[#0F1B33]">
            <span className="font-heading text-3xl font-bold text-white/70">
              {initials(tech.fullName)}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />

        {/* En ligne / Hors ligne */}
        <span
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-bold"
          style={
            tech.online
              ? { backgroundColor: ORANGE, color: "#fff" }
              : { backgroundColor: "rgba(9,18,25,0.85)", color: "rgba(255,255,255,0.65)" }
          }
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: tech.online ? "#fff" : "#7b8794" }}
          />
          {tech.online ? "En ligne" : "Hors ligne"}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-2.5 pb-2.5 pt-2">
        <p className="truncate font-heading text-[13px] font-semibold text-white">{tech.fullName}</p>

        <div className="flex items-center gap-1 text-[11px]">
          <Star size={12} className="fill-star text-star" />
          {tech.ratingAvg != null ? (
            <>
              <span className="font-semibold text-white">{tech.ratingAvg.toFixed(1)}</span>
              <span className="text-white/50">({tech.ratingCount} avis)</span>
            </>
          ) : (
            <span className="text-white/50">Nouveau</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-white/55">
          <CalendarDays size={12} />
          <span className="truncate">
            {tech.yearsExperience} an{tech.yearsExperience > 1 ? "s" : ""} d&apos;expérience
          </span>
        </div>

        <p className="mt-0.5 text-right text-[10.5px] text-white/50">
          À partir de{" "}
          <span className="font-semibold" style={{ color: ORANGE }}>
            {tech.startingPrice} DT
          </span>
        </p>
      </div>
    </Link>
  );
}
