import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MapPin,
  Navigation,
  DollarSign,
  Car,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestById } from "@/lib/db/requests";
import { getReviewByRequestId } from "@/lib/db/reviews";
import { getCategoryBySlug } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/client";
import { JobStatusTimeline } from "@/components/JobStatusTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DepartButton } from "./DepartButton";
import { formatDate, formatDT } from "@/lib/utils";
import {
  acceptAction,
  declineAction,
  cancelAction,
  arrivedAction,
  startWorkAction,
  completeAction,
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

  // Get category for visit price
  const category = await prisma.category.findUnique({
    where: { id: req.categoryId },
    select: { visitPrice: true, slug: true },
  });

  // Get technician transport info when relevant
  const techTransport =
    isTechnician ||
    req.status === "ARRIVED" ||
    req.status === "IN_PROGRESS" ||
    req.status === "COMPLETED"
      ? await prisma.technician.findFirst({
          where: { userId: req.technicianUserId },
          select: {
            distanceTraveled: true,
            transportFee: true,
            departureLatitude: true,
            departureLongitude: true,
          },
        })
      : null;

  const existingReview =
    isClient && req.status === "COMPLETED"
      ? await getReviewByRequestId(id)
      : null;

  const isTerminal = [
    "COMPLETED",
    "DECLINED",
    "CANCELLED",
  ].includes(req.status);

  const visitPrice = category?.visitPrice ?? 0;
  const transportFee = techTransport?.transportFee ?? null;
  const distanceKm = techTransport?.distanceTraveled ?? null;

  return (
    <div className="app-content">
      {/* Header */}
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
              {isTechnician
                ? req.clientFullName
                : req.technicianFullName}
            </p>

            <p className="text-xs text-muted">
              {isTechnician ? "Client" : req.technicianTitle}
            </p>
          </div>

          <CategoryIcon
            icon={req.categoryIcon}
            color={req.categoryColor}
            size={18}
            badgeSize={36}
          />
        </div>

        {/* Pricing card — visit price + transport */}
        {(visitPrice > 0 || transportFee != null) && (
          <div className="rounded-2xl border border-line bg-surface overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">
              Service Fees
            </p>

            <div className="divide-y divide-line">
              {visitPrice > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange-light shrink-0">
                    <DollarSign
                      size={14}
                      className="text-brand-orange"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      Visit fee (prix de visite)
                    </p>

                    <p className="text-xs text-muted">
                      Fixed fee for this category
                    </p>
                  </div>

                  <p className="font-heading text-base font-bold text-ink">
                    {formatDT(visitPrice)}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 shrink-0">
                  <Car size={14} className="text-blue-600" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    Transport fee
                  </p>

                  {distanceKm != null ? (
                    <p className="text-xs text-muted">
                      {distanceKm.toFixed(1)} km × 1 DT/km
                    </p>
                  ) : (
                    <p className="text-xs text-muted">
                      Calculated on arrival (1 DT/km)
                    </p>
                  )}
                </div>

                <p className="font-heading text-base font-bold text-ink">
                  {transportFee != null
                    ? formatDT(transportFee)
                    : "—"}
                </p>
              </div>

              {visitPrice > 0 && transportFee != null && (
                <div className="flex items-center justify-between px-4 py-3 bg-surface-alt">
                  <p className="text-sm font-bold text-ink">
                    Total fees
                  </p>

                  <p className="font-heading text-base font-bold text-brand-orange">
                    {formatDT(visitPrice + transportFee)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request details */}
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-2">
            Request details
          </p>

          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
            <Row label="Address" value={req.address} />
            <Row label="Phone" value={req.phone} />

            <div className="px-4 py-3">
              <p className="text-xs text-muted mb-1">
                Description
              </p>

              <p className="text-sm text-ink">
                {req.description}
              </p>
            </div>

            {req.photos.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs text-muted mb-2">
                  Photos
                </p>

                <div className="flex gap-2 flex-wrap">
                  {req.photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="font-heading text-sm font-semibold text-ink mb-4">
            Job progress
          </p>

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
            <MessageCircle
              size={20}
              className="text-brand-orange"
            />

            <span className="flex-1 text-sm font-medium text-ink">
              Message
            </span>

            <ChevronRight
              size={16}
              className="text-muted"
            />
          </Link>
        )}

        {/* ── TECHNICIAN ACTIONS ─────────────────────────────────── */}

        {/* Accept / Decline */}
        {isTechnician && req.status === "PENDING" && (
          <div className="flex gap-3">
            <form
              action={declineAction.bind(null, id)}
              className="flex-1"
            >
              <Button
                type="submit"
                variant="outline"
                fullWidth
                size="lg"
              >
                <XCircle size={18} />
                Decline
              </Button>
            </form>

            <form
              action={acceptAction.bind(null, id)}
              className="flex-1"
            >
              <Button
                type="submit"
                fullWidth
                size="lg"
              >
                <CheckCircle2 size={18} />
                Accept
              </Button>
            </form>
          </div>
        )}

        {/* Départ button — needs GPS so uses client component */}
        {isTechnician && req.status === "ACCEPTED" && (
          <DepartButton requestId={id} />
        )}

        {/* Mark as Arrived */}
        {isTechnician && req.status === "ON_THE_WAY" && (
          <form action={arrivedAction.bind(null, id)}>
            <Button
              type="submit"
              fullWidth
              size="lg"
            >
              <MapPin size={18} />
              Mark as Arrived
            </Button>
          </form>
        )}

        {/* Start Work */}
        {isTechnician && req.status === "ARRIVED" && (
          <form action={startWorkAction.bind(null, id)}>
            <Button
              type="submit"
              fullWidth
              size="lg"
            >
              Start Work
            </Button>
          </form>
        )}

        {/* Mark Completed */}
        {isTechnician && req.status === "IN_PROGRESS" && (
          <form action={completeAction.bind(null, id)}>
            <Button
              type="submit"
              fullWidth
              size="lg"
            >
              <CheckCircle2 size={18} />
              Mark as Completed
            </Button>
          </form>
        )}

        {/* ── CLIENT ACTIONS ─────────────────────────────────────── */}

        {/* Cancel while pending */}
        {isClient && req.status === "PENDING" && (
          <form action={cancelAction.bind(null, id)}>
            <Button
              type="submit"
              variant="outline"
              fullWidth
              size="lg"
            >
              Cancel Request
            </Button>
          </form>
        )}

        {/* Transport fee display when tech is on the way */}
        {isClient && req.status === "ON_THE_WAY" && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Navigation
              size={18}
              className="text-blue-600 shrink-0"
            />

            <div>
              <p className="text-sm font-semibold text-blue-800">
                Technician is on the way
              </p>

              <p className="text-xs text-blue-600">
                Transport fee will be confirmed on arrival
              </p>
            </div>
          </div>
        )}

        {/* Transport fee confirmed on arrival */}
        {isClient &&
          ["ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(
            req.status
          ) &&
          transportFee != null && (
            <div className="flex items-center justify-between rounded-2xl border border-success/30 bg-success-light px-4 py-3">
              <div className="flex items-center gap-2">
                <Car
                  size={16}
                  className="text-success shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-success">
                    Transport fee confirmed
                  </p>

                  {distanceKm != null && (
                    <p className="text-xs text-success/70">
                      {distanceKm.toFixed(1)} km × 1 DT/km
                    </p>
                  )}
                </div>
              </div>

              <p className="font-heading text-base font-bold text-success">
                {formatDT(transportFee)}
              </p>
            </div>
          )}

        {/* Confirm solved */}
        {isClient &&
          req.status === "COMPLETED" &&
          req.clientConfirmedSolved === null && (
            <div>
              <p className="font-heading text-sm font-semibold text-ink mb-3 text-center">
                Was the problem solved?
              </p>

              <div className="flex gap-3">
                <form
                  action={confirmSolvedAction.bind(
                    null,
                    id,
                    false
                  )}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    variant="outline"
                    fullWidth
                    size="lg"
                  >
                    <XCircle size={18} />
                    Not really
                  </Button>
                </form>

                <form
                  action={confirmSolvedAction.bind(
                    null,
                    id,
                    true
                  )}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                  >
                    <CheckCircle2 size={18} />
                    Yes, fixed!
                  </Button>
                </form>
              </div>
            </div>
          )}

        {/* Leave review */}
        {isClient &&
          req.status === "COMPLETED" &&
          !existingReview &&
          req.clientConfirmedSolved !== null && (
            <Link href={`/requests/${id}/rate`}>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
              >
                Leave a Review
              </Button>
            </Link>
          )}

        {isClient &&
          req.status === "COMPLETED" &&
          existingReview && (
            <p className="text-center text-sm text-success font-medium">
              ✓ Review submitted
            </p>
          )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-muted shrink-0">
        {label}
      </span>

      <span className="text-sm text-ink text-right">
        {value}
      </span>
    </div>
  );
}