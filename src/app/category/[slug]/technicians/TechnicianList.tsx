"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Star, MapPin, ShieldCheck, Clock,
  Navigation, Loader2, Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SeniorBadge } from "@/components/SeniorBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatDT, cn } from "@/lib/utils";
import { NAVY_ROW, NAVY_TILE } from "@/lib/theme";
import type { TechnicianWithUser, Category } from "@/lib/types";

// Haversine distance (same as server-side, for display only)
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortOption = "rating" | "price" | "distance" | "experience";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Best Rated" },
  { value: "price", label: "Lowest Price" },
  { value: "distance", label: "Nearest" },
  { value: "experience", label: "Most Experienced" },
];

export function TechnicianList({
  technicians,
  category,
  clientLat: initialLat,
  clientLng: initialLng,
}: {
  technicians: TechnicianWithUser[];
  category: Category;
  clientLat: number | null;
  clientLng: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState<SortOption>("rating");
  const [clientLat, setClientLat] = useState<number | null>(initialLat);
  const [clientLng, setClientLng] = useState<number | null>(initialLng);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Request GPS location
  function handleLocate() {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported on this device.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setClientLat(lat);
        setClientLng(lng);
        setLocating(false);
        setSort("distance");
        // Reload page with GPS params → server filters by radius
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(lat));
        params.set("lng", String(lng));
        router.replace(`${pathname}?${params.toString()}`);
      },
      () => {
        setLocating(false);
        setLocError("Could not get your location. Please allow location access.");
      },
      { timeout: 8000 }
    );
  }

  // Sort
  const sorted = [...technicians].sort((a, b) => {
    if (sort === "rating") {
      if (a.isSenior !== b.isSenior) return a.isSenior ? -1 : 1;
      return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
    }
    if (sort === "price") return a.startingPrice - b.startingPrice;
    if (sort === "distance" && clientLat != null && clientLng != null) {
      const dA = haversineKm(clientLat, clientLng, a.latitude, a.longitude);
      const dB = haversineKm(clientLat, clientLng, b.latitude, b.longitude);
      return dA - dB;
    }
    if (sort === "experience") return b.yearsExperience - a.yearsExperience;
    return 0;
  });

  return (
    <div className="px-5 py-5 flex flex-col gap-4">

      {/* Visit price banner */}
      {category.visitPrice > 0 && (
        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ backgroundColor: NAVY_ROW }}
        >
          <div>
            <p className="text-xs text-white/60">Visit fee (prix de visite)</p>
            <p className="font-heading text-lg font-bold text-white">
              {formatDT(category.visitPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">+ Transport</p>
            <p className="text-sm font-semibold text-white">1 DT / km</p>
          </div>
        </div>
      )}

      {/* Locate me + sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleLocate}
          disabled={locating}
          style={clientLat ? undefined : { backgroundColor: NAVY_TILE }}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            clientLat
              ? "bg-success/15 text-success"
              : "text-white/75 hover:text-white"
          )}
        >
          {locating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          {clientLat ? "Location active" : "Use my location"}
        </button>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              disabled={opt.value === "distance" && !clientLat}
              style={sort === opt.value ? undefined : { backgroundColor: NAVY_TILE }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                sort === opt.value
                  ? "bg-brand-orange text-white"
                  : "text-white/75 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location error */}
      {locError && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-xs text-danger">
          {locError}
        </p>
      )}

      {/* Count */}
      <div className="flex items-center gap-1.5">
        <Users size={14} className="text-white/60" />
        <p className="text-sm text-white/60">
          <span className="font-semibold text-white">{sorted.length}</span>
          {" "}technician{sorted.length !== 1 ? "s" : ""} available
          {clientLat ? " nearby" : ""}
        </p>
      </div>

      {/* Empty */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: NAVY_ROW }}
          >
            <CategoryIcon
              icon={category.icon}
              color={category.color}
              size={24}
              badgeSize={52}
              variant="navy"
            />
          </div>
          <p className="font-heading text-base font-semibold text-white">
            No technicians found
          </p>
          <p className="text-sm text-white/60 max-w-xs">
            {clientLat
              ? "No technicians available in your area. Try expanding the search or come back later."
              : "No technicians registered for this category yet."}
          </p>
        </div>
      )}

      {/* Technician cards */}
      <div className="flex flex-col gap-3">
        {sorted.map((tech) => {
          const distanceKm =
            clientLat != null && clientLng != null
              ? haversineKm(clientLat, clientLng, tech.latitude, tech.longitude)
              : null;

          return (
            <Link
              key={tech.id}
              href={`/technician/${tech.id}?category=${category.slug}`}
              style={{ backgroundColor: NAVY_ROW }}
              className="flex flex-col gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]"
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <Avatar
                  src={tech.avatarUrl}
                  name={tech.fullName}
                  size={52}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <p className="font-heading text-sm font-bold text-white truncate">
                      {tech.fullName}
                    </p>
                    {tech.isSenior && <SeniorBadge size="sm" />}
                    {tech.verified && (
                      <ShieldCheck size={14} className="text-success shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/60">{tech.title}</p>

                  {/* Rating */}
                  {tech.ratingAvg != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        size={12}
                        className="fill-star text-star shrink-0"
                      />
                      <span className="text-xs font-semibold text-white">
                        {tech.ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/60">
                        ({tech.ratingCount})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: price + distance */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-white/60">Starting from</p>
                    <p className="font-heading text-sm font-bold text-white">
                      {formatDT(tech.startingPrice)}
                    </p>
                  </div>
                  {distanceKm != null && (
                    <div className="flex items-center gap-0.5">
                      <MapPin size={10} className="text-white/60" />
                      <span className="text-[10px] text-white/60">
                        {distanceKm < 1
                          ? `${Math.round(distanceKm * 1000)} m`
                          : `${distanceKm.toFixed(1)} km`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom row: experience + visit price */}
              <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-white/60 shrink-0" />
                  <span className="text-xs text-white/60">
                    {tech.yearsExperience} yr{tech.yearsExperience !== 1 ? "s" : ""} experience
                  </span>
                </div>

                {category.visitPrice > 0 && (
                  <>
                    <div className="h-3 w-px bg-white/15" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/60">Visit fee:</span>
                      <span className="text-xs font-semibold text-brand-orange">
                        {formatDT(category.visitPrice)}
                      </span>
                    </div>
                  </>
                )}

                {distanceKm != null && (
                  <>
                    <div className="h-3 w-px bg-white/15" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white/60">Transport:</span>
                      <span className="text-xs font-semibold text-white">
                        ~{formatDT(Math.round(distanceKm))}
                      </span>
                    </div>
                  </>
                )}

                <div className="ml-auto">
                  <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white">
                    Book
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}