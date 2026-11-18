"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  MoreHorizontal,
  X,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { ProCategoryIcon } from "@/components/ProCategoryIcon";
import { HomeTechnicianCard } from "@/components/HomeTechnicianCard";
import { NAVY_ROW, NAVY_TILE, ORANGE } from "@/lib/theme";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { tOr } from "@/lib/i18n/translate";
import { formatDT } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { TFn } from "@/lib/i18n/translate";
import type { Category } from "@/lib/types";
import type { HomeTechnician } from "@/lib/db/homeTechnicians";

const QUICK_COUNT = 4; // categories shown in the quick row (+ "Autres")

function catName(t: TFn, cat: Category): string {
  return tOr(t, `category.${cat.slug}.name`, cat.name);
}

function subtitle(t: TFn, locale: Locale, cat: Category): string {
  const desc = tOr(t, `category.${cat.slug}.desc`, cat.description ?? "");
  if (desc) {
    return desc.length > 60 ? desc.slice(0, 58).trimEnd() + "…" : desc;
  }
  return cat.visitPrice > 0
    ? t("client.grid.subtitleFrom", { price: formatDT(cat.visitPrice, locale) })
    : t("client.grid.subtitleDefault");
}

export function CategoryGrid({
  categories,
  technicians,
}: {
  categories: Category[];
  technicians: HomeTechnician[];
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visibleTechs = technicians.filter((x) => !onlineOnly || x.availability === "AVAILABLE");

  // Search results
  const catResults = categories.filter(
    (c) => c.name.toLowerCase().includes(q) || catName(t, c).toLowerCase().includes(q)
  );
  const techResults = visibleTechs.filter(
    (x) => x.fullName.toLowerCase().includes(q) || x.title.toLowerCase().includes(q)
  );

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
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/50"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("client.grid.searchPlaceholder")}
            className="w-full rounded-2xl bg-transparent py-3.5 ps-11 pe-10 text-[14.5px] text-white outline-none placeholder:text-white/45"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("client.grid.clear")}
              className="absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:text-white"
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
          aria-label={t("client.grid.onlineOnlyAria")}
          title={t("client.grid.onlineOnlyTitle")}
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
          {t("client.grid.onlineOnlyNote")}
        </p>
      )}

      {searching ? (
        /* ── Search results ──────────────────────────────────────────── */
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-3 font-heading text-[16px] font-semibold text-white">
              {t("client.grid.servicesCount", { count: catResults.length })}
            </p>
            {catResults.length === 0 ? (
              <p className="text-sm text-white/50">{t("client.grid.noService")}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {catResults.map((cat) => {
                  const row = (
                    <>
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-brand-orange/70"
                        style={{ backgroundColor: NAVY_TILE }}
                      >
                        <ProCategoryIcon icon={cat.icon} size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-white">{catName(t, cat)}</p>
                        <p className="truncate text-xs text-white/50">
                          {cat.isActive ? subtitle(t, locale, cat) : t("client.grid.unavailable")}
                        </p>
                      </div>
                      {cat.isActive && <ChevronRight size={18} className="shrink-0 text-white/40 rtl:rotate-180" />}
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
              {t("client.grid.techniciansCount", { count: techResults.length })}
            </p>
            {techResults.length === 0 ? (
              <p className="text-sm text-white/50">{t("client.grid.noTechnician")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {techResults.map((x) => (
                  <HomeTechnicianCard key={x.id} tech={x} categorySlug={x.categorySlugs[0]} width="100%" />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Quick categories: 4 + "Autres" ───────────────────────── */}
          <div className="grid grid-cols-5 gap-2">
            {categories.slice(0, QUICK_COUNT).map((cat) => {
              const inner = (
                <>
                  <div
                    className="flex aspect-square w-full items-center justify-center rounded-[20px] border-[1.5px] border-brand-orange/80 shadow-[0_0_18px_rgba(245,97,36,0.12)]"
                    style={{ backgroundColor: NAVY_TILE }}
                  >
                    <ProCategoryIcon icon={cat.icon} size={30} />
                  </div>
                  <span className="line-clamp-2 w-full break-words text-center text-[10px] font-medium leading-tight tracking-tight text-white/80">
                    {catName(t, cat)}
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
                  title={t("client.grid.unavailableService")}
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
                className="flex aspect-square w-full items-center justify-center rounded-[20px] border-[1.5px] border-brand-orange/80"
                style={{ backgroundColor: "rgba(245,97,36,0.12)" }}
              >
                <MoreHorizontal size={24} color={ORANGE} strokeWidth={2} />
              </div>
              <span className="w-full text-center text-[10px] font-medium leading-tight tracking-tight text-white/80">
                {t("client.grid.others")}
              </span>
            </Link>
          </div>

          {/* ── One block per category: banner, then its technicians ───── */}
          <div className="flex flex-col gap-9">
            {categories
              .slice()
              .sort(
                (a, b) =>
                  Number(b.isActive) - Number(a.isActive) ||
                  (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
                  (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
                  a.sortOrder - b.sortOrder
              )
              .map((cat) => {
                const techs = visibleTechs
                  .filter((x) => x.categorySlugs.includes(cat.slug))
                  .slice(0, 12);
                return (
                  <section key={cat.id} className="flex flex-col gap-3.5">
                    <CategoryBanner cat={cat} />

                    {cat.isActive && (
                      techs.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-white/85">
                              {t("client.grid.techniciansIn", { name: catName(t, cat) })}
                            </p>
                            <Link
                              href={`/category/${cat.slug}/technicians`}
                              className="flex items-center gap-0.5 text-xs font-semibold"
                              style={{ color: ORANGE }}
                            >
                              {t("common.viewAll")} <ChevronRight size={14} className="rtl:rotate-180" />
                            </Link>
                          </div>
                          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-1">
                            {techs.map((x) => (
                              <HomeTechnicianCard key={x.id} tech={x} categorySlug={cat.slug} />
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="rounded-xl px-3 py-2.5 text-center text-xs text-white/45" style={{ backgroundColor: NAVY_ROW }}>
                          {onlineOnly
                            ? t("client.grid.noTechInCategoryOnline")
                            : t("client.grid.noTechNow")}
                        </p>
                      )
                    )}
                  </section>
                );
              })}
          </div>

          {onlineOnly && visibleTechs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm font-medium text-white">{t("client.grid.noTechNow")}</p>
              <p className="text-xs text-white/50">{t("client.grid.disableFilter")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Category banner: name + description + "Découvrir" on the left, photo on the right. */
function CategoryBanner({ cat }: { cat: Category }) {
  const { t, locale } = useI18n();
  const [failed, setFailed] = useState(false);

  const body = (
    <>
      {/* Photo on the right */}
      <div className="absolute inset-y-0 end-0 w-[55%]">
        {cat.imageUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cat.imageUrl}
            alt={catName(t, cat)}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(90deg, rgba(15,24,33,0) 0%, rgba(245,97,36,0.2) 100%)" }}
          >
            <ProCategoryIcon icon={cat.icon} size={72} className="ms-6" />
          </div>
        )}
        {/* fade into the card colour so the text stays readable */}
        {cat.imageUrl && !failed && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${NAVY_ROW} 0%, rgba(15,24,33,0.7) 35%, rgba(15,24,33,0.05) 100%)`,
            }}
          />
        )}
      </div>

      {/* Text on the left */}
      <div className="relative z-10 flex h-full w-[64%] flex-col justify-center gap-1.5 p-4">
        <p className="font-heading text-[21px] font-bold leading-tight text-white">{catName(t, cat)}</p>
        <p className="line-clamp-3 text-[12.5px] leading-snug text-white/70">
          {cat.isActive ? subtitle(t, locale, cat) : t("client.grid.unavailable")}
        </p>
        {cat.isActive && (
          <span
            className="mt-1.5 flex w-fit items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold text-white shadow-lg shadow-black/30"
            style={{ backgroundColor: ORANGE }}
          >
            {t("client.grid.discover")} <ArrowRight size={15} className="rtl:rotate-180" />
          </span>
        )}
      </div>
    </>
  );

  const cls =
    "relative block h-[158px] w-full overflow-hidden rounded-3xl border border-white/10";

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
