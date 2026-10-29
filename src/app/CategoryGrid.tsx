"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  MoreHorizontal,
  X,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HomeTechnicianCard } from "@/components/HomeTechnicianCard";
import { NAVY_ROW, NAVY_TILE, ORANGE } from "@/lib/theme";
import type { Category } from "@/lib/types";
import type { HomeTechnician } from "@/lib/db/homeTechnicians";

const QUICK_COUNT = 4; // categories shown in the quick row (+ "Autres")

function subtitle(cat: Category): string {
  if (cat.description) {
    return cat.description.length > 60
      ? cat.description.slice(0, 58).trimEnd() + "…"
      : cat.description;
  }
  return cat.visitPrice > 0 ? `À partir de ${cat.visitPrice} DT` : "Rapide • Fiable • Professionnel";
}

export function CategoryGrid({
  categories,
  technicians,
}: {
  categories: Category[];
  technicians: HomeTechnician[];
}) {
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [slide, setSlide] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // "Services populaires" = most reviewed / best rated first (falls back to admin order)
  const byPopularity = [...categories]
    .filter((c) => c.isActive)
    .sort(
      (a, b) =>
        (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
        (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
        a.sortOrder - b.sortOrder
    );
  const inactive = categories.filter((c) => !c.isActive);
  const slides = [...byPopularity, ...inactive];

  const visibleTechs = technicians.filter((t) => !onlineOnly || t.online);

  // Search results
  const catResults = categories.filter((c) => c.name.toLowerCase().includes(q));
  const techResults = visibleTechs.filter(
    (t) => t.fullName.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
  );

  function onHeroScroll() {
    const el = heroRef.current;
    if (!el || el.clientWidth === 0) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ── Smart search bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex-1 rounded-2xl border border-white/10 shadow-lg shadow-black/30 transition-colors focus-within:border-brand-orange"
          style={{ backgroundColor: NAVY_ROW }}
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un service, un technicien…"
            className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-10 text-[14.5px] text-white outline-none placeholder:text-white/45"
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

        {/* Filter: only technicians who are online */}
        <button
          type="button"
          onClick={() => setOnlineOnly((v) => !v)}
          aria-pressed={onlineOnly}
          aria-label="Afficher seulement les techniciens en ligne"
          title="Techniciens en ligne seulement"
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border transition-colors"
          style={
            onlineOnly
              ? { backgroundColor: ORANGE, borderColor: ORANGE, color: "#fff" }
              : { backgroundColor: NAVY_ROW, borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }
          }
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {onlineOnly && (
        <p className="-mt-3 flex items-center gap-1.5 text-xs text-white/60">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ORANGE }} />
          Seulement les techniciens en ligne
        </p>
      )}

      {searching ? (
        /* ── Search results ──────────────────────────────────────────── */
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-3 font-heading text-[16px] font-semibold text-white">
              Services ({catResults.length})
            </p>
            {catResults.length === 0 ? (
              <p className="text-sm text-white/50">Aucun service trouvé</p>
            ) : (
              <div className="flex flex-col gap-3">
                {catResults.map((cat) => {
                  const row = (
                    <>
                      <CategoryIcon icon={cat.icon} color={cat.color} size={22} badgeSize={48} variant="dark" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-white">{cat.name}</p>
                        <p className="truncate text-xs text-white/50">
                          {cat.isActive ? subtitle(cat) : "Temporairement indisponible"}
                        </p>
                      </div>
                      {cat.isActive && <ChevronRight size={18} className="shrink-0 text-white/40" />}
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

          <div>
            <p className="mb-3 font-heading text-[16px] font-semibold text-white">
              Techniciens ({techResults.length})
            </p>
            {techResults.length === 0 ? (
              <p className="text-sm text-white/50">Aucun technicien trouvé</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {techResults.map((t) => (
                  <HomeTechnicianCard key={t.id} tech={t} categorySlug={t.categorySlugs[0]} width="100%" />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Quick categories: 4 + "Autres" ───────────────────────── */}
          <div className="grid grid-cols-5 gap-2.5">
            {categories.slice(0, QUICK_COUNT).map((cat) => {
              const inner = (
                <>
                  <div
                    className="flex aspect-square w-full items-center justify-center rounded-2xl border border-white/[0.08]"
                    style={{ backgroundColor: NAVY_TILE }}
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      color="#ffffff"
                      size={24}
                      badgeSize={40}
                      variant="navy"
                      className="!bg-transparent"
                    />
                  </div>
                  <span className="line-clamp-2 w-full text-center text-[10.5px] font-medium leading-tight text-white/80">
                    {cat.name}
                  </span>
                </>
              );
              return cat.isActive ? (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={cat.id}
                  title="Service temporairement indisponible"
                  className="flex cursor-not-allowed flex-col items-center gap-1.5 opacity-35 grayscale"
                >
                  {inner}
                </div>
              );
            })}

            {/* Autres → page with every category */}
            <Link
              href="/categories"
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <div
                className="flex aspect-square w-full items-center justify-center rounded-2xl border border-brand-orange/40"
                style={{ backgroundColor: "rgba(245,97,36,0.12)" }}
              >
                <MoreHorizontal size={24} color={ORANGE} strokeWidth={2} />
              </div>
              <span className="w-full text-center text-[10.5px] font-medium leading-tight text-white/80">
                Autres
              </span>
            </Link>
          </div>

          {/* ── Services populaires: slider ──────────────────────────── */}
          {slides.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ORANGE }} />
                  <p className="font-heading text-[18px] font-semibold text-white">Services populaires</p>
                </div>
                <Link
                  href="/categories"
                  className="flex items-center gap-0.5 text-xs font-semibold"
                  style={{ color: ORANGE }}
                >
                  Voir tout <ChevronRight size={14} />
                </Link>
              </div>

              <div
                ref={heroRef}
                onScroll={onHeroScroll}
                className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5"
              >
                {slides.map((cat) => (
                  <HeroSlide key={cat.id} cat={cat} />
                ))}
              </div>

              {slides.length > 1 && (
                <div className="mt-3 flex justify-center gap-1.5">
                  {slides.map((cat, i) => (
                    <span
                      key={cat.id}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === slide ? 16 : 6,
                        backgroundColor: i === slide ? ORANGE : "rgba(255,255,255,0.22)",
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── One technician slider per category ───────────────────── */}
          {byPopularity.map((cat) => {
            const techs = visibleTechs.filter((t) => t.categorySlugs.includes(cat.slug)).slice(0, 12);
            if (techs.length === 0) return null;
            return (
              <section key={cat.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ORANGE }} />
                    <p className="font-heading text-[17px] font-semibold text-white">{cat.name}</p>
                  </div>
                  <Link
                    href={`/category/${cat.slug}/technicians`}
                    className="flex items-center gap-0.5 text-xs font-semibold"
                    style={{ color: ORANGE }}
                  >
                    Voir tout <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
                  {techs.map((t) => (
                    <HomeTechnicianCard key={t.id} tech={t} categorySlug={cat.slug} />
                  ))}
                </div>
              </section>
            );
          })}

          {onlineOnly && visibleTechs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm font-medium text-white">Aucun technicien en ligne pour le moment</p>
              <p className="text-xs text-white/50">Désactivez le filtre pour voir tout le monde.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Big slide: name + "Découvrir" on the left, category photo on the right. */
function HeroSlide({ cat }: { cat: Category }) {
  const [failed, setFailed] = useState(false);
  const body = (
    <>
      {/* Photo on the right */}
      <div className="absolute inset-y-0 right-0 w-[58%]">
        {cat.imageUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cat.imageUrl}
            alt={cat.name}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cat.color}66 0%, #0F1821 100%)` }}
          >
            <CategoryIcon icon={cat.icon} color="#ffffff" size={54} badgeSize={96} className="!bg-white/10" />
          </div>
        )}
        {/* fade into the card colour */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${NAVY_ROW} 0%, rgba(15,24,33,0.55) 38%, rgba(15,24,33,0) 100%)` }}
        />
      </div>

      {/* Text on the left */}
      <div className="relative z-10 flex h-full w-[62%] flex-col justify-center gap-1 p-4">
        <span
          className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: "rgba(245,97,36,0.18)", color: ORANGE }}
        >
          {cat.name}
        </span>
        <p className="font-heading text-[19px] font-bold leading-tight text-white">
          {cat.isActive ? "Un pro à portée de main" : "Bientôt disponible"}
        </p>
        <p className="line-clamp-2 text-[12px] leading-snug text-white/65">{subtitle(cat)}</p>
        {cat.isActive && (
          <span
            className="mt-2 flex w-fit items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold text-white shadow-md"
            style={{ backgroundColor: ORANGE }}
          >
            Découvrir <ArrowRight size={14} />
          </span>
        )}
      </div>
    </>
  );

  const cls =
    "relative h-[168px] w-full shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10";

  return cat.isActive ? (
    <Link
      href={`/category/${cat.slug}`}
      className={cls + " transition-transform active:scale-[0.99]"}
      style={{ backgroundColor: NAVY_ROW }}
    >
      {body}
    </Link>
  ) : (
    <div className={cls + " cursor-not-allowed opacity-45 grayscale"} style={{ backgroundColor: NAVY_ROW }}>
      {body}
    </div>
  );
}
