"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NAVY_ROW, NAVY_TILE } from "@/lib/theme";
import type { Category } from "@/lib/types";

export function AllCategories({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = categories.filter((c) => c.name.toLowerCase().includes(q));

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <Link
          href="/"
          aria-label="Retour"
          style={{ backgroundColor: NAVY_TILE }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-heading text-base font-semibold text-white">Toutes les catégories</p>
          <p className="text-xs text-white/50">
            {categories.length} service{categories.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Search */}
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

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search size={28} className="text-white/40" />
            <p className="text-sm font-medium text-white">Aucun service trouvé</p>
            <p className="text-xs text-white/50">Essayez un autre mot-clé</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {list.map((cat) => {
              const inner = (
                <>
                  <CategoryIcon
                    icon={cat.icon}
                    color={cat.color}
                    size={26}
                    badgeSize={64}
                    variant="navy"
                  />
                  <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-white/80">
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
          </div>
        )}
      </div>
    </div>
  );
}
