"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a service..."
          className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-[15px] outline-none focus:border-brand-orange"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {query && (
        <p className="text-xs text-muted px-1">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &quot;{query}&quot;
        </p>
      )}

      {/* Category grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Search size={28} className="text-muted" />
          <p className="text-sm font-medium text-ink">No services found</p>
          <p className="text-xs text-muted">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((cat) => {
            const isInactive = !cat.isActive;

            if (isInactive) {
              // Grayed out, not clickable
              return (
                <div
                  key={cat.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center opacity-40 grayscale cursor-not-allowed"
                  title="This service is temporarily unavailable"
                >
                  <CategoryIcon
                    icon={cat.icon}
                    color={cat.color}
                    size={22}
                    badgeSize={48}
                  />
                  <p className="text-[11px] font-medium text-ink leading-tight">
                    {cat.name}
                  </p>
                  <span className="text-[9px] text-muted font-semibold uppercase tracking-wide">
                    Unavailable
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center transition-all active:scale-[0.97] hover:border-brand-orange hover:shadow-sm"
              >
                <CategoryIcon
                  icon={cat.icon}
                  color={cat.color}
                  size={22}
                  badgeSize={48}
                />
                <p className="text-[11px] font-medium text-ink leading-tight">
                  {cat.name}
                </p>
                {cat.visitPrice > 0 && (
                  <span className="text-[9px] text-muted font-medium">
                    From {cat.visitPrice} DT
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}