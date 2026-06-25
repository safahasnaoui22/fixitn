import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestById } from "@/lib/db/requests";
import { getReviewByRequestId } from "@/lib/db/reviews";
import { Avatar } from "@/components/ui/Avatar";
import { RatingForm } from "./RatingForm";

export default async function RatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const req = await getRequestById(id);
  if (!req) notFound();
  if (req.clientId !== session.userId) redirect(`/requests/${id}`);
  if (req.status !== "COMPLETED") redirect(`/requests/${id}`);

  const existing = await getReviewByRequestId(id);
  if (existing) redirect(`/requests/${id}`);

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href={`/requests/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <p className="font-heading text-base font-semibold text-ink">Leave a Review</p>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-alt p-3 mb-6">
          <Avatar src={req.technicianAvatarUrl} name={req.technicianFullName} size={48} />
          <div>
            <p className="font-heading text-sm font-semibold text-ink">{req.technicianFullName}</p>
            <p className="text-xs text-muted">{req.categoryName}</p>
          </div>
        </div>

        <Suspense fallback={null}>
          <RatingForm requestId={id} technicianName={req.technicianFullName} />
        </Suspense>
      </div>
    </div>
  );
}