import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PlayCircle, Zap, ShieldCheck, ThumbsUp } from "lucide-react";
import { getCategoryBySlug } from "@/lib/db/catalog";
import { Button } from "@/components/ui/Button";
import { DARK_BG, NAVY_ROW, NAVY_TILE, NAV_BG } from "@/lib/theme";
import { getT } from "@/lib/i18n/server";
import { tDb, tOr } from "@/lib/i18n/translate";
import { CategoryHero } from "./CategoryHero";

const PERKS = [
  { icon: Zap, key: "client.category.perkFast" },
  { icon: ShieldCheck, key: "client.category.perkCertified" },
  { icon: ThumbsUp, key: "client.category.perkQuote" },
];

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getT();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const catName = tOr(t, `category.${category.slug}.name`, category.name);
  const catDesc = category.description
    ? tOr(t, `category.${category.slug}.desc`, category.description)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: DARK_BG }}>
      <div className="app-content no-scrollbar">
        {/* Header: arrow + category name */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Link
            href="/"
            aria-label={t("common.back")}
            style={{ backgroundColor: NAVY_TILE }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </Link>
          <p className="font-heading text-base font-semibold text-white">{catName}</p>
        </div>

        {/* Full-width image with title + description over its shadow */}
        <CategoryHero
          imageUrl={category.imageUrl}
          name={catName}
          description={catDesc}
          icon={category.icon}
          color={category.color}
          ratingAvg={category.ratingAvg}
          ratingCount={category.ratingCount}
        />

        <div className="px-5 pb-6 pt-4">
          {/* 3 small cards */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {PERKS.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center"
                style={{ backgroundColor: NAVY_ROW }}
              >
                <Icon size={22} className="text-brand-orange" strokeWidth={1.8} />
                <span className="text-[11px] font-medium leading-tight text-white/80">{t(key)}</span>
              </div>
            ))}
          </div>

          {category.videoUrl && (
            <a
              href={category.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex h-44 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: NAVY_ROW }}
            >
              <PlayCircle size={40} />
            </a>
          )}

          {category.howItWorks.length > 0 && (
            <div className="mt-7">
              <p className="font-heading text-base font-semibold text-white">{t("client.category.howItWorks")}</p>
              <div className="mt-3 flex flex-col gap-3">
                {category.howItWorks.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-sm font-bold text-brand-orange">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm text-white/85">{tDb(t, "howItWorks", step)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/10 px-5 py-4"
        style={{ backgroundColor: NAV_BG }}
      >
        <Link href={`/category/${category.slug}/technicians`}>
          <Button fullWidth size="lg">
            {t("client.category.findTechnician")}
          </Button>
        </Link>
      </div>
    </div>
  );
}