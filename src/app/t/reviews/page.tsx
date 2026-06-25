import { redirect } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTechnicianByUserId } from "@/lib/db/catalog";
import { listReviewsForTechnician, getRatingBreakdown } from "@/lib/db/reviews";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { EmptyState } from "@/components/ui/Card";
import { TechBottomNav } from "@/components/TechBottomNav";
import { formatRelativeTime } from "@/lib/utils";

export default async function TechReviewsPage() {
  const session = await requireRole("TECHNICIAN");
  const technician = await getTechnicianByUserId(session.userId);
  if (!technician) redirect("/onboarding");

  const [breakdown, reviews] = await Promise.all([
    getRatingBreakdown(technician.id),
    listReviewsForTechnician(technician.id),
  ]);

  return (
    <>
      <div className="app-content no-scrollbar">
        <div className="border-b border-line px-5 py-4">
          <p className="font-heading text-lg font-semibold text-ink">My Reviews</p>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="Clients can leave a review after each completed job."
          />
        ) : (
          <div className="px-5 py-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="font-heading text-4xl font-bold text-ink">
                    {breakdown.avg?.toFixed(1) ?? "—"}
                  </p>
                  <StarRating value={breakdown.avg ?? 0} size={14} className="mt-1" />
                  <p className="text-xs text-muted mt-1">
                    {breakdown.total} review{breakdown.total !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {([5, 4, 3, 2, 1] as const).map((star) => {
                    const count = breakdown.counts[star];
                    const pct = breakdown.total > 0
                      ? Math.round((count / breakdown.total) * 100)
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-3 shrink-0 text-right text-xs text-muted">{star}</span>
                        <Star size={11} className="fill-star text-star shrink-0" />
                        <div className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full rounded-full bg-star" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 shrink-0 text-xs text-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={review.authorAvatarUrl} name={review.authorFullName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{review.authorFullName}</p>
                      <p className="text-xs text-muted">{formatRelativeTime(review.createdAt)}</p>
                    </div>
                    <StarRating value={review.rating} size={14} className="shrink-0" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TechBottomNav />
    </>
  );
}