"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";

interface Props {
  slug: string;
  name: string;
  icon: string;
  color: string;
  ratingAvg: number | null;
  ratingCount: number | null;
}

/**
 * Hero image of a category.
 * Looks for  /public/categories/<slug>.jpg  (e.g. public/categories/electrician.jpg).
 * If the image does not exist yet, shows a gradient with the big icon instead.
 */
export function CategoryHero({ slug, name, icon, color, ratingAvg, ratingCount }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-[#141E40]">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/categories/${slug}.jpg`}
          alt={name}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}55 0%, #141E40 100%)`,
          }}
        >
          <CategoryIcon icon={icon} color="#ffffff" size={56} badgeSize={104} className="bg-white/10" />
        </div>
      )}

      {/* soft dark fade so the rating stays readable on any photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/25" />

      {/* Rating — top right */}
      {ratingAvg != null && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs backdrop-blur-sm">
          <Star size={13} className="fill-star text-star" />
          <span className="font-semibold text-white">{ratingAvg.toFixed(1)}</span>
          <span className="text-white/70">({ratingCount ?? 0})</span>
        </div>
      )}
    </div>
  );
}