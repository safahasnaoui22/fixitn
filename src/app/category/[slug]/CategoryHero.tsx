"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NAVY_ROW, HERO_FADE } from "@/lib/theme";

interface Props {
  imageUrl: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  ratingAvg: number | null;
  ratingCount: number | null;
}

/**
 * Full-width hero (no side padding). The image fades into the page background
 * with a soft shadow, and the category name + description sit on top of that
 * shadow, so there is no gap between the picture and the text.
 * Without an image (or if it fails to load) a gradient with the big icon is shown.
 */
export function CategoryHero({
  imageUrl,
  name,
  description,
  icon,
  color,
  ratingAvg,
  ratingCount,
}: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="relative h-72 w-full overflow-hidden"
      style={{ backgroundColor: NAVY_ROW }}
    >
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-start justify-center pt-12"
          style={{
            background: `linear-gradient(135deg, ${color}55 0%, ${NAVY_ROW} 100%)`,
          }}
        >
          <CategoryIcon icon={icon} color="#ffffff" size={56} badgeSize={104} className="bg-white/10" />
        </div>
      )}

      {/* Shadow: light at the top, darker towards the bottom where the text sits */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, ${HERO_FADE}c7 68%, ${HERO_FADE} 100%)`,
        }}
      />

      {/* Rating — top right */}
      {ratingAvg != null && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs backdrop-blur-sm">
          <Star size={13} className="fill-star text-star" />
          <span className="font-semibold text-white">{ratingAvg.toFixed(1)}</span>
          <span className="text-white/70">({ratingCount ?? 0})</span>
        </div>
      )}

      {/* Title + description on top of the shadow */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
        <p className="font-heading text-2xl font-bold text-white">{name}</p>
        {description && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-white/80">{description}</p>
        )}
      </div>
    </div>
  );
}