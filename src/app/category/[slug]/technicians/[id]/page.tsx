import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Briefcase, ThumbsUp, type LucideIcon } from "lucide-react";
import { getTechnicianById, getTechnicianStats, listCategoriesForTechnician } from "@/lib/db/catalog";
import { getRatingBreakdown, listReviewsForTechnician } from "@/lib/db/reviews";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { formatDT, formatRelativeTime } from "@/lib/utils";

export default async function TechnicianProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = await params;
  const { category: categorySlug } = await searchParams;
  const technician = await getTechnicianById(id);
  if (!technician) notFound();

  const [stats, categories, ratingBreakdown, reviews] = await Promise.all([
    getTechnicianStats(id),
    listCategoriesForTechnician(id),
    getRatingBreakdown(id),
    listReviewsForTechnician(id),
  ]);

  const effectiveSlug = categorySlug ?? categories[0]?.slug;
  const requestHref = `/technician/${id}/request${effectiveSlug ? `?category=${effectiveSlug}` : ""}`;

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
          <ArrowLeft size={18} />
        </Link>
        <p className="font-heading text-base font-semibold text-ink">Technician Profile</p>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center gap-4">
          <Avatar src={technician.avatarUrl} name={technician.fullName} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-heading text-lg font-bold text-ink">{technician.fullName}</p>
              {technician.verified && (
                <span className="rounded-full bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted">{technician.title}</p>
            {technician.ratingAvg != null && (
              <div className="mt-1 flex items-center gap-1">
                <Star size={14} className="fill-star text-star" />
                <span className="text-sm font-semibold text-ink">{technician.ratingAvg.toFixed(1)}</span>
                <span className="text-xs text-muted">({technician.ratingCount})</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatBox icon={Briefcase} label="Jobs done" value={String(stats.jobsCompleted)} />
          <StatBox
            icon={ThumbsUp}
            label="Satisfaction"
            value={stats.satisfactionPct != null ? `${stats.satisfactionPct}%` : "—"}
          />
          <StatBox icon={Star} label="Years exp." value={String(technician.yearsExperience)} />
        </div>

        {technician.bio && <p className="mt-5 text-[15px] leading-relaxed text-muted">{technician.bio}</p>}

        {categories.length > 0 && (
          <div className="mt-6">
            <p className="font-heading text-sm font-semibold text-ink">Services</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink"
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} size={12} badgeSize={20} />
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {technician.galleryImages.length > 0 && (
          <div className="mt-6">
            <p className="font-heading text-sm font-semibold text-ink">Work gallery</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {technician.galleryImages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-28 w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold text-ink">Reviews ({ratingBreakdown.total})</p>
            {ratingBreakdown.avg != null && (
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-star text-star" />
                <span className="text-sm font-semibold text-ink">{ratingBreakdown.avg.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar src={review.authorAvatarUrl} name={review.authorFullName} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{review.authorFullName}</p>
                    <span className="shrink-0 text-xs text-muted">{formatRelativeTime(review.createdAt)}</span>
                  </div>
                  <StarRating value={review.rating} size={13} className="mt-0.5" />
                  {review.comment && <p className="mt-1 text-sm text-muted">{review.comment}</p>}
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-4">
        <div>
          <p className="text-xs text-muted">Starting at</p>
          <p className="font-heading text-lg font-bold text-ink">{formatDT(technician.startingPrice)}</p>
        </div>
        <Link href={requestHref} className="flex-1">
          <Button fullWidth size="lg">
            Request Service
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface-alt py-3 text-center">
      <Icon size={18} className="text-brand-orange" />
      <p className="font-heading text-base font-bold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}