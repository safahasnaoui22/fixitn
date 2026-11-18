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
import { ReportUserButton } from "@/components/ReportUserButton";
import { formatDate, formatDT } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { DARK_BG, NAVY_ROW, NAVY_TILE, ORANGE_TILE } from "@/lib/theme";
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
  const t = await getT();
  const locale = await getLocale();
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
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: DARK_BG }}>
    <div className="app-content no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <Link
          href={isTechnician ? "/t/requests" : "/requests"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: NAVY_TILE }}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold text-white">
            {req.categoryName}
          </p>
          <p className="text-xs text-white/60">{formatDate(req.createdAt, locale)}</p>
        </div>

        <StatusBadge status={req.status} dark />
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Person card */}
        <div className="flex items-center gap-3 rounded-2xl p-3"
          style={{ backgroundColor: NAVY_ROW }}>
          <Avatar
            src={isTechnician ? req.clientAvatarUrl : req.technicianAvatarUrl}
            name={isTechnician ? req.clientFullName : req.technicianFullName}
            size={48}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold text-white">
              {isTechnician
                ? req.clientFullName
                : req.technicianFullName}
            </p>

            <p className="text-xs text-white/60">
              {isTechnician ? t("booking.detail.client") : req.technicianTitle}
            </p>
          </div>

          <CategoryIcon
            icon={req.categoryIcon}
            color={req.categoryColor}
            size={18}
            badgeSize={36}
            variant="dark"
          />
        </div>

        {/* Pricing card — visit price + transport */}
        {(visitPrice > 0 || transportFee != null) && (
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: NAVY_ROW }}>
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
              {t("booking.detail.serviceFees")}
            </p>

            <div className="divide-y divide-white/10">
              {visitPrice > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: ORANGE_TILE }}>
                    <DollarSign
                      size={14}
                      className="text-brand-orange"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {t("booking.detail.visitFee")}
                    </p>

                    <p className="text-xs text-white/60">
                      {t("booking.detail.visitFeeDesc")}
                    </p>
                  </div>

                  <p className="font-heading text-base font-bold text-white">
                    {formatDT(visitPrice, locale)}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400/15 shrink-0">
                  <Car size={14} className="text-blue-300" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {t("booking.detail.transportFee")}
                  </p>

                  {distanceKm != null ? (
                    <p className="text-xs text-white/60">
                      {t("booking.detail.kmRate", { km: distanceKm.toFixed(1) })}
                    </p>
                  ) : (
                    <p className="text-xs text-white/60">
                      {t("booking.detail.calcOnArrival")}
                    </p>
                  )}
                </div>

                <p className="font-heading text-base font-bold text-white">
                  {transportFee != null
                    ? formatDT(transportFee, locale)
                    : "—"}
                </p>
              </div>

              {visitPrice > 0 && transportFee != null && (
                <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: NAVY_TILE }}>
                  <p className="text-sm font-bold text-white">
                    {t("booking.detail.totalFees")}
                  </p>

                  <p className="font-heading text-base font-bold text-brand-orange">
                    {formatDT(visitPrice + transportFee, locale)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request details */}
        <div>
          <p className="font-heading text-sm font-semibold text-white mb-2">
            {t("booking.detail.requestDetails")}
          </p>

          <div className="rounded-2xl divide-y divide-white/10" style={{ backgroundColor: NAVY_ROW }}>
            <Row label={t("booking.detail.address")} value={req.address} />
            <Row label={t("booking.detail.phone")} value={req.phone} />

            <div className="px-4 py-3">
              <p className="text-xs text-white/60 mb-1">
                {t("booking.detail.description")}
              </p>

              <p className="text-sm text-white">
                {req.description}
              </p>
            </div>

            {req.photos.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs text-white/60 mb-2">
                  {t("booking.detail.photos")}
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
          <p className="font-heading text-sm font-semibold text-white mb-4">
            {t("booking.detail.jobProgress")}
          </p>

          <JobStatusTimeline
            dark
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
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ backgroundColor: NAVY_ROW }}
          >
            <MessageCircle
              size={20}
              className="text-brand-orange"
            />

            <span className="flex-1 text-sm font-medium text-white">
              {t("booking.detail.message")}
            </span>

            <ChevronRight
              size={16}
              className="text-white/60 rtl:rotate-180"
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
                className="border-white/25 text-white hover:bg-white/10"
                fullWidth
                size="lg"
              >
                <XCircle size={18} />
                {t("booking.detail.decline")}
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
                {t("booking.detail.accept")}
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
              {t("jobStatusAction.ON_THE_WAY")}
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
              {t("jobStatusAction.ARRIVED")}
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
              {t("jobStatusAction.IN_PROGRESS")}
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
                className="border-white/25 text-white hover:bg-white/10"
              fullWidth
              size="lg"
            >
              {t("booking.detail.cancelRequest")}
            </Button>
          </form>
        )}

        {/* Transport fee display when tech is on the way */}
        {isClient && req.status === "ON_THE_WAY" && (
          <div className="flex items-center gap-3 rounded-2xl bg-blue-400/10 px-4 py-3">
            <Navigation
              size={18}
              className="text-blue-300 shrink-0"
            />

            <div>
              <p className="text-sm font-semibold text-blue-200">
                {t("booking.detail.onTheWayTitle")}
              </p>

              <p className="text-xs text-blue-300">
                {t("booking.detail.onTheWayDesc")}
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
            <div className="flex items-center justify-between rounded-2xl bg-emerald-400/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Car
                  size={16}
                  className="text-emerald-300 shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {t("booking.detail.transportConfirmed")}
                  </p>

                  {distanceKm != null && (
                    <p className="text-xs text-emerald-300/70">
                      {t("booking.detail.kmRate", { km: distanceKm.toFixed(1) })}
                    </p>
                  )}
                </div>
              </div>

              <p className="font-heading text-base font-bold text-emerald-300">
                {formatDT(transportFee, locale)}
              </p>
            </div>
          )}

        {/* Confirm solved */}
        {isClient &&
          req.status === "COMPLETED" &&
          req.clientConfirmedSolved === null && (
            <div>
              <p className="font-heading text-sm font-semibold text-white mb-3 text-center">
                {t("booking.detail.wasSolved")}
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
                className="border-white/25 text-white hover:bg-white/10"
                    fullWidth
                    size="lg"
                  >
                    <XCircle size={18} />
                    {t("booking.detail.notReally")}
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
                    {t("booking.detail.yesFixed")}
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
                variant="primary"
                fullWidth
                size="lg"
              >
                {t("booking.detail.leaveReview")}
              </Button>
            </Link>
          )}

        {isClient &&
          req.status === "COMPLETED" &&
          existingReview && (
            <p className="text-center text-sm text-emerald-300 font-medium">
              {t("booking.detail.reviewSubmitted")}
            </p>
          )}

        <div className="flex justify-center pt-2">
          <ReportUserButton
            reportedUserId={isClient ? req.technicianUserId : req.clientId}
            reportedName={isClient ? req.technicianFullName : req.clientFullName}
            requestId={req.id}
          />
        </div>
      </div>
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
      <span className="text-xs text-white/60 shrink-0">
        {label}
      </span>

      <span className="text-sm text-white text-end">
        {value}
      </span>
    </div>
  );
}