import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestById } from "@/lib/db/requests";
import { getReviewByRequestId } from "@/lib/db/reviews";
import { JobStatusTimeline } from "@/components/JobStatusTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatDate } from "@/lib/utils";
import { NEXT_ACTION_LABEL } from "@/lib/constants";
import {
  acceptAction,
  declineAction,
  cancelAction,
  advanceStatusAction,
  confirmSolvedAction,
} from "./actions";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const req = await getRequestById(id);
  if (!req) notFound();

  const isClient = session.userId === req.clientId;
  const isTechnician = session.userId === req.technicianUserId;
  if (!isClient && !isTechnician) redirect("/");

  const existingReview =
    isClient && req.status === "COMPLETED"
      ? await getReviewByRequestId(id)
      : null;

  const isTerminal = ["COMPLETED", "DECLINED", "CANCELLED"].includes(req.status);
  const nextActionLabel = NEXT_ACTION_LABEL[req.status];

  return (
    <div className="app-content">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link
          href={isTechnician ? "/t/requests" : "/requests"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold text-ink">
            {req.categoryName}
          </p>
          <p className="text-xs text-muted">{formatDate(req.createdAt)}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">

        {/* Person card */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-alt p-3">
          <Avatar
            src={isTechnician ? req.clientAvatarUrl : req.technicianAvatarUrl}
            name={isTechnician ? req.clientFullName : req.technicianFullName}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold text-ink">
              {isTechnician ? req.clientFullName : req.technicianFullName}
            </p>
            <p className="text-xs text-muted">
              {isTechnician ? "Client" : req.technicianTitle}
            </p>
          </div>
          <CategoryIcon icon={req.categoryIcon} color={req.categoryColor} size={18} badgeSize={36} />
        </div>

        {/* Request details */}
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-2">Request details</p>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
            <Row label="Address" value={req.address} />
            <Row label="Phone" value={req.phone} />
            <div className="px-4 py-3">
              <p className="text-xs text-muted mb-1">Description</p>
              <p className="text-sm text-ink">{req.description}</p>
            </div>
            {req.photos.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs text-muted mb-2">Photos</p>
                <div className="flex gap-2 flex-wrap">
                  {req.photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-4">Job progress</p>
          <JobStatusTimeline
            status={req.status}
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

        {/* Chat shortcut */}
        {!isTerminal && (
          <Link
            href={`/requests/${id}/chat`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <MessageCircle size={20} className="text-brand-orange" />
            <span className="flex-1 text-sm font-medium text-ink">Message</span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        )}

        {/* TECHNICIAN: accept / decline */}
        {isTechnician && req.status === "PENDING" && (
          <div className="flex gap-3">
            <form action={declineAction.bind(null, id)} className="flex-1">
              <Button type="submit" variant="outline" fullWidth size="lg">
                <XCircle size={18} />
                Decline
              </Button>
            </form>
            <form action={acceptAction.bind(null, id)} className="flex-1">
              <Button type="submit" fullWidth size="lg">
                <CheckCircle2 size={18} />
                Accept
              </Button>
            </form>
          </div>
        )}

        {/* TECHNICIAN: advance status */}
        {isTechnician && nextActionLabel && req.status !== "PENDING" && (
          <form action={advanceStatusAction.bind(null, id)}>
            <Button type="submit" fullWidth size="lg">
              {nextActionLabel}
            </Button>
          </form>
        )}

        {/* CLIENT: cancel while pending */}
        {isClient && req.status === "PENDING" && (
          <form action={cancelAction.bind(null, id)}>
            <Button type="submit" variant="outline" fullWidth size="lg">
              Cancel Request
            </Button>
          </form>
        )}

        {/* CLIENT: confirm solved */}
        {isClient && req.status === "COMPLETED" && req.clientConfirmedSolved === null && (
          <div>
            <p className="font-heading text-sm font-semibold text-ink mb-3 text-center">
              Was the problem solved?
            </p>
            <div className="flex gap-3">
              <form action={confirmSolvedAction.bind(null, id, false)} className="flex-1">
                <Button type="submit" variant="outline" fullWidth size="lg">
                  <XCircle size={18} />
                  Not really
                </Button>
              </form>
              <form action={confirmSolvedAction.bind(null, id, true)} className="flex-1">
                <Button type="submit" fullWidth size="lg">
                  <CheckCircle2 size={18} />
                  Yes, fixed!
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* CLIENT: leave review */}
        {isClient && req.status === "COMPLETED" && !existingReview && req.clientConfirmedSolved !== null && (
          <Link href={`/requests/${id}/rate`}>
            <Button variant="secondary" fullWidth size="lg">
              Leave a Review
            </Button>
          </Link>
        )}

        {isClient && req.status === "COMPLETED" && existingReview && (
          <p className="text-center text-sm text-success font-medium">✓ Review submitted</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{value}</span>
    </div>
  );
}