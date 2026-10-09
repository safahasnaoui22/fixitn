"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NAVY_ROW } from "@/lib/theme";
import type { Category } from "@/lib/types";

const POPULAR_COUNT = 4;

function subtitle(cat: Category): string {
  if (cat.description) {
    return cat.description.length > 42
      ? cat.description.slice(0, 40).trimEnd() + "…"
      : cat.description;
  }
  return cat.visitPrice > 0 ? `À partir de ${cat.visitPrice} DT` : "Intervention rapide";
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const searching = query.trim().length > 0;
  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  // "Services populaires" = best rated / most reviewed first (falls back to the
  // admin sort order). "Voir tout" expands the list to every service.
  const byPopularity = [...categories]
    .filter((c) => c.isActive)
    .sort(
      (a, b) =>
        (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
        (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
        a.sortOrder - b.sortOrder
    );
  const popular = showAll ? byPopularity : byPopularity.slice(0, POPULAR_COUNT);
  const list = searching ? filtered : popular;

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un service…"
          style={{ backgroundColor: NAVY_ROW }}
          className="w-full rounded-2xl border-0 py-3.5 pl-11 pr-10 text-[15px] text-white outline-none placeholder:text-white/45 focus:ring-1 focus:ring-brand-orange"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Effacer"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category row: 3 categories + "Autres" (hidden while searching) */}
      {!searching && (
        <div className="flex items-start justify-between gap-3 px-1">
          {categories.slice(0, 3).map((cat) => {
            const inner = (
              <>
                <CategoryIcon
                  icon={cat.icon}
                  color={cat.color}
                  size={26}
                  badgeSize={64}
                  variant="navy"
                />
                <span className="line-clamp-2 w-[72px] text-center text-[11px] font-medium leading-tight text-white/80">
                  {cat.name}
                </span>
              </>
            );
            return cat.isActive ? (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 transition-transform active:scale-95"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={cat.id}
                title="Service temporairement indisponible"
                className="flex cursor-not-allowed flex-col items-center gap-2 opacity-35 grayscale"
              >
                {inner}
              </div>
            );
          })}

          {/* Autres → shows every service in the list below */}
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex flex-col items-center gap-2 transition-transform active:scale-95"
          >
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, backgroundColor: "#1A2650" }}
            >
              <MoreHorizontal size={26} color="#FFFFFF" strokeWidth={1.8} />
            </div>
            <span className="w-[72px] text-center text-[11px] font-medium leading-tight text-white/80">
              Autres
            </span>
          </button>
        </div>
      )}

      {/* Section title */}
      <div className="flex items-center justify-between">
        <p className="font-heading text-[17px] font-semibold text-white">
          {searching
            ? `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`
            : "Services populaires"}
        </p>
        {!searching && categories.length > POPULAR_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-0.5 text-xs font-medium text-white/55 hover:text-white"
          >
            {showAll ? "Voir moins" : "Voir tout"}
            <ChevronRight
              size={14}
              className={showAll ? "-rotate-90 transition-transform" : "transition-transform"}
            />
          </button>
        )}
      </div>

      {/* Service list */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Search size={28} className="text-white/40" />
          <p className="text-sm font-medium text-white">Aucun service trouvé</p>
          <p className="text-xs text-white/50">Essayez un autre mot-clé</p>
        </div>
      ) : (
        <div className="-mt-2 flex flex-col gap-3">
          {list.map((cat) => {
            const row = (
              <>
                <CategoryIcon
                  icon={cat.icon}
                  color={cat.color}
                  size={22}
                  badgeSize={48}
                  variant="dark"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-white">
                    {cat.name}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {cat.isActive ? subtitle(cat) : "Temporairement indisponible"}
                  </p>
                </div>
                {cat.isActive && (
                  <ChevronRight size={18} className="shrink-0 text-white/40" />
                )}
              </>
            );
            return cat.isActive ? (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                style={{ backgroundColor: NAVY_ROW }}
                className="flex items-center gap-3.5 rounded-2xl p-3.5 transition-all active:scale-[0.98]"
              >
                {row}
              </Link>
            ) : (
              <div
                key={cat.id}
                style={{ backgroundColor: NAVY_ROW }}
                className="flex cursor-not-allowed items-center gap-3.5 rounded-2xl p-3.5 opacity-40 grayscale"
              >
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}