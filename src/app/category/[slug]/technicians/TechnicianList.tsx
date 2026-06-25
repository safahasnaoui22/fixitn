"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Card";
import { haversineKm, formatDistance, formatDT } from "@/lib/utils";
import { DEFAULT_CENTER } from "@/lib/constants";
import type { TechnicianWithUser } from "@/lib/types";

interface TechWithDistance extends TechnicianWithUser {
  distanceKm: number;
}

export function TechnicianList({
  technicians,
  categorySlug,
}: {
  technicians: TechnicianWithUser[];
  categorySlug: string;
}) {
  const [origin, setOrigin] = useState(DEFAULT_CENTER);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {
        /* denied or unavailable — keep the Tunis-center fallback */
      },
      { timeout: 5000 }
    );
  }, []);

  const withDistance: TechWithDistance[] = technicians
    .map((t) => ({ ...t, distanceKm: haversineKm(origin, t) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (withDistance.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No technicians yet"
        description="Nobody offers this service in your area right now — check back soon."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      {withDistance.map((t) => (
        <Link
          key={t.id}
          href={`/technician/${t.id}?category=${categorySlug}`}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-transform active:scale-[0.98]"
        >
          <Avatar src={t.avatarUrl} name={t.fullName} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-heading text-sm font-semibold text-ink">{t.fullName}</p>
              {t.verified && (
                <span className="rounded-full bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success">
                  Verified
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">{t.title}</p>
            <div className="mt-1 flex items-center gap-3 text-xs">
              {t.ratingAvg != null && (
                <span className="flex items-center gap-1 font-medium text-ink">
                  <Star size={12} className="fill-star text-star" />
                  {t.ratingAvg.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1 text-muted">
                <MapPin size={12} />
                {formatDistance(t.distanceKm)}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted">From</p>
            <p className="font-heading text-sm font-bold text-brand-orange">{formatDT(t.startingPrice)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}