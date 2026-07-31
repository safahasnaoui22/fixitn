import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { getAdminRequestDetail } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { JobStatusTimeline } from "@/components/JobStatusTimeline";
import { StarRating } from "@/components/ui/StarRating";
import { formatDate, formatDateTime, formatDT } from "@/lib/utils";
import type { JobStatus } from "@/lib/constants";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const req = await getAdminRequestDetail(id);
  if (!req) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/requests"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Request Detail</h1>
          <p className="text-xs text-muted font-mono">{req.id}</p>
        </div>
        <StatusBadge status={req.status as JobStatus} className="ml-auto" />
      </div>

      {/* Category + contact */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <CategoryIcon icon={req.category.icon} color={req.category.color} size={20} badgeSize={44} />
          <div>
            <p className="font-heading text-base font-semibold text-ink">{req.category.name}</p>
            <p className="text-xs text-muted">{formatDateTime(req.createdAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Contact name" value={req.fullName} />
          <InfoRow label="Phone" value={req.phone} />
          <InfoRow label="Address" value={req.address} />
          {req.clientConfirmedSolved !== null && (
            <div className="rounded-xl bg-surface-alt px-3 py-2.5">
              <p className="text-[10px] text-muted mb-1">Solved?</p>
              <div className="flex items-center gap-1.5">
                {req.clientConfirmedSolved ? (
                  <><CheckCircle2 size={14} className="text-success" /><span className="text-sm font-semibold text-success">Yes</span></>
                ) : (
                  <><XCircle size={14} className="text-danger" /><span className="text-sm font-semibold text-danger">No</span></>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 rounded-xl bg-surface-alt px-3 py-2.5">
          <p className="text-[10px] text-muted mb-1">Description</p>
          <p className="text-sm text-ink">{req.description}</p>
        </div>
      </div>

      {/* Client + Technician side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Client</p>
          <div className="flex items-center gap-3">
            <Avatar src={req.client.avatarUrl} name={req.client.fullName} size={40} />
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-ink truncate">{req.client.fullName}</p>
              <p className="text-xs text-muted">{req.client.phone}</p>
            </div>
          </div>
          <Link href={`/admin/users/${req.client.id}`} className="mt-3 block text-xs font-semibold text-brand-orange hover:underline">
            View profile →
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Technician</p>
          <div className="flex items-center gap-3">
            <Avatar src={req.technician.avatarUrl} name={req.technician.fullName} size={40} />
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-ink truncate">{req.technician.fullName}</p>
              <p className="text-xs text-muted">{req.technician.phone}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              req.technician.planKey !== "FREE"
                ? "bg-brand-orange-light text-brand-orange-dark"
                : "bg-surface-alt text-muted"
            }`}>
              {req.technician.planKey}
            </span>
            <span className="text-xs text-muted">
              {Math.round(req.technician.commissionRate * 100)}% commission
            </span>
          </div>
          <Link href={`/admin/technicians/${req.technician.id}`} className="mt-2 block text-xs font-semibold text-brand-orange hover:underline">
            View profile →
          </Link>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-heading text-sm font-semibold text-ink mb-5">Job Timeline</p>
        <JobStatusTimeline
          status={req.status as JobStatus}
          pendingAt={req.pendingAt}
          acceptedAt={req.acceptedAt}
          onTheWayAt={req.onTheWayAt}
          arrivedAt={req.arrivedAt}
          inProgressAt={req.inProgressAt}
          completedAt={req.completedAt}
          declinedAt={req.declinedAt}
          cancelledAt={req.cancelledAt}
        />
      </div>

      {/* Payment */}
      {req.payment && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="font-heading text-sm font-semibold text-ink mb-4">Payment</p>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Gross amount" value={formatDT(req.payment.amount)} />
            <InfoRow label="Platform fee" value={formatDT(req.payment.platformFee)} />
            <InfoRow label="Net to technician" value={formatDT(req.payment.amount - req.payment.platformFee)} />
            <InfoRow label="Method" value={req.payment.method} />
            <InfoRow label="Status" value={req.payment.status} />
            <InfoRow label="Date" value={formatDate(req.payment.createdAt)} />
          </div>
        </div>
      )}

      {/* Review */}
      {req.review && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="font-heading text-sm font-semibold text-ink mb-3">Review</p>
          <div className="flex items-center gap-3">
            <StarRating value={req.review.rating} size={18} />
            <span className="text-sm font-semibold text-ink">{req.review.rating}/5</span>
            <span className="text-xs text-muted">by {req.review.authorFullName}</span>
          </div>
          {req.review.comment && (
            <p className="mt-2 text-sm text-muted">{req.review.comment}</p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <p className="text-[10px] text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}