import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, PlayCircle } from "lucide-react";
import { getCategoryBySlug } from "@/lib/db/catalog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/Button";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
          <ArrowLeft size={18} />
        </Link>
        <p className="font-heading text-base font-semibold text-ink">{category.name}</p>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center gap-4">
          <CategoryIcon icon={category.icon} color={category.color} size={32} badgeSize={64} />
          <div>
            <p className="font-heading text-xl font-bold text-ink">{category.name}</p>
            {category.ratingAvg != null && (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <Star size={15} className="fill-star text-star" />
                <span className="font-semibold text-ink">{category.ratingAvg.toFixed(1)}</span>
                <span className="text-muted">({category.ratingCount} ratings)</span>
              </div>
            )}
          </div>
        </div>

        {category.description && (
          <p className="mt-5 text-[15px] leading-relaxed text-muted">{category.description}</p>
        )}

     {category.videoUrl ? (
  <a
    href={category.videoUrl}
    target="_blank"
    rel="noreferrer"
    className="mt-5 flex h-44 items-center justify-center rounded-2xl bg-brand-navy text-white"
  >
    <PlayCircle size={40} />
  </a>
) : (
          <div
            className="mt-5 flex h-36 items-center justify-center rounded-2xl"
            style={{ backgroundColor: category.color }}
          >
            <CategoryIcon icon={category.icon} color="#ffffff" size={48} badgeSize={88} className="bg-white/15" />
          </div>
        )}

        {category.howItWorks.length > 0 && (
          <div className="mt-7">
            <p className="font-heading text-base font-semibold text-ink">How it works</p>
            <div className="mt-3 flex flex-col gap-3">
              {category.howItWorks.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange-light text-sm font-bold text-brand-orange">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm text-ink">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface px-5 py-4">
        <Link href={`/category/${category.slug}/technicians`}>
          <Button fullWidth size="lg">
            Find a Technician
          </Button>
        </Link>
      </div>
    </div>
  );
}