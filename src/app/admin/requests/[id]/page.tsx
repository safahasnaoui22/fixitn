import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Route, Wallet, Flag,
  MessageSquare, MapPin, Timer, Navigation, ExternalLink,
} from "lucide-react";
import { getAdminRequestDetail } from "@/lib/db/admin";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/CategoryIcon";
import { JobStatusTimeline } from "@/components/JobStatusTimeline";
import { StarRating } from "@/components/ui/StarRating";
import { formatDate, formatDateTime, formatDT, formatTime } from "@/lib/utils";
import type { JobStatus } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import { tDb, tOr, type TFn } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

/** "12 min", "1 h 05", "2 j 3 h" — or "—" when a step is missing. */
function duration(t: TFn, from: string | null, to: string | null): string {
  if (!from || !to) return "—";
  const min = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
  if (min < 1) return t("admin.reqDetail.lessThanMin");
  if (min < 60) return t("admin.reqDetail.durMin", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("admin.reqDetail.durHour", { h, m: String(min % 60).padStart(2, "0") });
  return t("admin.reqDetail.durDay", { d: Math.floor(h / 24), h: h % 24 });
}

const REPORT_STATUS: Record<string, { cls: string }> = {
  OPEN: { cls: "bg-red-50 text-red-700" },
  INVESTIGATING: { cls: "bg-amber-50 text-amber-700" },
  RESOLVED: { cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { cls: "bg-surface-alt text-muted" },
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("requests");
  const { id } = await params;
  const req = await getAdminRequestDetail(id);
  if (!req) notFound();

  const endAt = req.completedAt ?? req.declinedAt ?? req.cancelledAt;
  const visit = req.category.visitPrice;
  const transport = req.transportFee;
  const expectedTotal = visit + (transport ?? 0);
  const notRecorded = t("admin.reqDetail.notRecorded");
  const d = (a: string | null, b: string | null) => duration(t, a, b);

  // ---- map (OpenStreetMap embed, no extra library) ----
  const points = [req.clientPoint, req.departure].filter(
    (p): p is { latitude: number; longitude: number } => !!p
  );
  const mapPoints = points.length ? points : [req.technicianBase];
  const lats = mapPoints.map((p) => p.latitude);
  const lngs = mapPoints.map((p) => p.longitude);
  const pad = 0.01 + (Math.max(...lats) - Math.min(...lats) + Math.max(...lngs) - Math.min(...lngs)) * 0.25;
  const bbox = [
    Math.min(...lngs) - pad,
    Math.min(...lats) - pad,
    Math.max(...lngs) + pad,
    Math.max(...lats) + pad,
  ].join(",");
  const markerPoint = req.clientPoint ?? req.departure ?? req.technicianBase;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerPoint.latitude},${markerPoint.longitude}`;
  const gmaps = (p: { latitude: number; longitude: number }) =>
    `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  const routeUrl =
    req.departure && req.clientPoint
      ? `https://www.google.com/maps/dir/?api=1&origin=${req.departure.latitude},${req.departure.longitude}&destination=${req.clientPoint.latitude},${req.clientPoint.longitude}`
      : null;

  const steps: { label: string; value: string }[] = [
    { label: t("admin.reqDetail.step.accepted"), value: d(req.pendingAt, req.acceptedAt) },
    { label: t("admin.reqDetail.step.left"), value: d(req.acceptedAt, req.onTheWayAt) },
    { label: t("admin.reqDetail.step.travel"), value: d(req.onTheWayAt, req.arrivedAt) },
    { label: t("admin.reqDetail.step.wait"), value: d(req.arrivedAt, req.inProgressAt) },
    { label: t("admin.reqDetail.step.work"), value: d(req.inProgressAt, req.completedAt) },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/requests"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">{t("admin.reqDetail.title")}</h1>
          <p className="text-xs text-muted font-mono">{req.id}</p>
        </div>
        <StatusBadge status={req.status as JobStatus} className="ms-auto" />
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={Timer} label={t("admin.reqDetail.totalDuration")} value={d(req.pendingAt, endAt)} />
        <Stat
          icon={Route}
          label={t("admin.reqDetail.distance")}
          value={req.distanceKm != null ? t("common.distanceKm", { n: req.distanceKm.toFixed(1) }) : notRecorded}
        />
        <Stat
          icon={Wallet}
          label={t("admin.reqDetail.clientPays")}
          value={formatDT(expectedTotal, locale)}
        />
        <Stat icon={Flag} label={t("admin.reqDetail.complaints")} value={String(req.reports.length)} tone={req.reports.length ? "danger" : undefined} />
        <Stat icon={MessageSquare} label={t("admin.reqDetail.messages")} value={String(req.conversation.length)} />
      </div>

      {/* Category + contact */}
      <Section title={t("admin.reqDetail.request")}>
        <div className="flex items-center gap-3 mb-4">
          <CategoryIcon icon={req.category.icon} color={req.category.color} size={20} badgeSize={44} />
          <div>
            <p className="font-heading text-base font-semibold text-ink">{req.category.name}</p>
            <p className="text-xs text-muted">{t("admin.reqDetail.created", { date: formatDateTime(req.createdAt, locale) })}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoRow label={t("admin.reqDetail.contactName")} value={req.fullName} />
          <InfoRow label={t("common.phone")} value={req.phone} ltr />
          <InfoRow label={t("admin.reqDetail.address")} value={req.address} />
          <div className="rounded-xl bg-surface-alt px-3 py-2.5">
            <p className="text-[10px] text-muted mb-1">{t("admin.reqDetail.solvedQ")}</p>
            {req.clientConfirmedSolved === null ? (
              <span className="text-sm text-muted">{t("admin.reqDetail.notAnswered")}</span>
            ) : req.clientConfirmedSolved ? (
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /><span className="text-sm font-semibold text-success">{t("common.yes")}</span></div>
            ) : (
              <div className="flex items-center gap-1.5"><XCircle size={14} className="text-danger" /><span className="text-sm font-semibold text-danger">{t("common.no")}</span></div>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-surface-alt px-3 py-2.5">
          <p className="text-[10px] text-muted mb-1">{t("admin.reqDetail.description")}</p>
          <p className="text-sm text-ink whitespace-pre-wrap">{req.description}</p>
        </div>
      </Section>

      {/* Client + Technician */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t("admin.requests.col.client")}</p>
          <div className="flex items-center gap-3">
            <Avatar src={req.client.avatarUrl} name={req.client.fullName} size={40} />
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-ink truncate">{req.client.fullName}</p>
              <p className="text-xs text-muted" dir="ltr">{req.client.phone}</p>
            </div>
          </div>
          <Link href={`/admin/users/${req.client.id}`} className="mt-3 block text-xs font-semibold text-brand-orange hover:underline">
            {t("admin.reqDetail.viewProfile")}
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t("admin.requests.col.technician")}</p>
          <div className="flex items-center gap-3">
            <Avatar src={req.technician.avatarUrl} name={req.technician.fullName} size={40} />
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-ink truncate">{req.technician.fullName}</p>
              <p className="text-xs text-muted" dir="ltr">{req.technician.phone}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              req.technician.planKey !== "FREE" ? "bg-brand-orange-light text-brand-orange-dark" : "bg-surface-alt text-muted"
            }`}>
              {tOr(t, `plan.${req.technician.planKey}`, req.technician.planKey)}
            </span>
            <span className="text-xs text-muted">{t("admin.reqDetail.commission", { pct: Math.round(req.technician.commissionRate * 100) })}</span>
          </div>
          <Link href={`/admin/technicians/${req.technician.id}`} className="mt-2 block text-xs font-semibold text-brand-orange hover:underline">
            {t("admin.reqDetail.viewProfile")}
          </Link>
        </div>
      </div>

      {/* Timeline + durations */}
      <Section title={t("admin.reqDetail.timelineTitle")}>
        <div className="grid gap-6 md:grid-cols-2">
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
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
              <Clock size={13} /> {t("admin.reqDetail.timePerStep")}
            </p>
            {steps.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2.5">
                <span className="text-xs text-muted">{s.label}</span>
                <span className="text-sm font-semibold text-ink">{s.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-brand-orange-light px-3 py-2.5">
              <span className="text-xs font-semibold text-brand-orange-dark">{t("admin.reqDetail.totalReqEnd")}</span>
              <span className="text-sm font-bold text-brand-orange-dark">{d(req.pendingAt, endAt)}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Distance + map */}
      <Section title={t("admin.reqDetail.distanceMap")}>
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <iframe dir="ltr"
            title={t("admin.reqDetail.jobMap")}
            src={mapSrc}
            loading="lazy"
            className="h-72 w-full rounded-xl border border-line"
          />
          <div className="flex flex-col gap-2">
            <InfoRow
              label={t("admin.reqDetail.distanceTravelled")}
              value={req.distanceKm != null ? t("common.distanceKm", { n: req.distanceKm.toFixed(2) }) : notRecorded}
            />
            <InfoRow label={t("admin.reqDetail.transportFee")} value={transport != null ? formatDT(transport, locale) : notRecorded} />
            <InfoRow label={t("admin.reqDetail.leftAt")} value={req.onTheWayAt ? formatTime(req.onTheWayAt, locale) : "—"} />
            <InfoRow label={t("admin.reqDetail.arrivedAt")} value={req.arrivedAt ? formatTime(req.arrivedAt, locale) : "—"} />
            <div className="mt-1 flex flex-col gap-1.5">
              {req.clientPoint && <MapLink href={gmaps(req.clientPoint)} label={t("admin.reqDetail.clientLocation")} icon={MapPin} />}
              {req.departure && <MapLink href={gmaps(req.departure)} label={t("admin.reqDetail.techDeparture")} icon={Navigation} />}
              {routeUrl && <MapLink href={routeUrl} label={t("admin.reqDetail.openRoute")} icon={Route} />}
            </div>
          </div>
        </div>
        {!req.clientPoint && (
          <p className="mt-3 text-xs text-muted">{t("admin.reqDetail.noGps")}</p>
        )}
        {req.onTheWayAt && !req.departure && (
          <p className="mt-3 text-xs text-muted">
            {t("admin.reqDetail.noDeparture")}
          </p>
        )}
      </Section>

      {/* Money */}
      <Section title={t("admin.reqDetail.money")}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoRow label={t("admin.reqDetail.visitPrice")} value={formatDT(visit, locale)} />
          <InfoRow label={t("admin.reqDetail.transportFee")} value={transport != null ? formatDT(transport, locale) : notRecorded} />
          <InfoRow label={t("admin.reqDetail.clientTotal")} value={formatDT(expectedTotal, locale)} />
          <InfoRow label={t("admin.reqDetail.techPlan")} value={`${tOr(t, `plan.${req.technician.planKey}`, req.technician.planKey)} · ${Math.round(req.technician.commissionRate * 100)}%`} />
          {req.payment ? (
            <>
              <InfoRow label={t("admin.reqDetail.paymentAmount")} value={formatDT(req.payment.amount, locale)} />
              <InfoRow label={t("admin.reqDetail.platformFee")} value={formatDT(req.payment.platformFee, locale)} />
              <InfoRow label={t("admin.reqDetail.netToTech")} value={formatDT(req.payment.amount - req.payment.platformFee, locale)} />
              <InfoRow label={t("admin.reqDetail.methodStatus", { status: tOr(t, `paymentStatus.${req.payment.status}`, req.payment.status) })} value={`${tOr(t, `paymentMethod.${req.payment.method}`, req.payment.method)} · ${formatDate(req.payment.createdAt, locale)}`} />
            </>
          ) : (
            <div className="col-span-2 md:col-span-4 rounded-xl bg-surface-alt px-3 py-2.5 text-xs text-muted">
              {t("admin.reqDetail.noPayment")}
            </div>
          )}
        </div>
      </Section>

      {/* Complaints */}
      <Section title={t("admin.reqDetail.complaintsCount", { count: req.reports.length })}>
        {req.reports.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.reqDetail.noComplaint")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {req.reports.map((r) => (
              <Link
                key={r.id}
                href={`/admin/complaints/${r.id}`}
                className="rounded-xl border border-line p-3 transition-colors hover:border-brand-orange"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{tDb(t, "reportReason", r.reason)}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${REPORT_STATUS[r.status]?.cls ?? "bg-surface-alt text-muted"}`}>
                    {REPORT_STATUS[r.status] ? t(`admin.reqDetail.report.${r.status}`) : r.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {r.reporterName} <span className="inline-block rtl:rotate-180">→</span> {r.reportedName ?? "—"} · {formatDateTime(r.createdAt, locale)}
                </p>
                {r.details && <p className="mt-1.5 line-clamp-2 text-sm text-ink">{r.details}</p>}
              </Link>
            ))}
          </div>
        )}
        {req.chatRestricted && (
          <p className="mt-3 text-xs font-semibold text-red-600">{t("admin.reqDetail.chatRestricted")}</p>
        )}
      </Section>

      {/* Discussion */}
      <Section title={t("admin.reqDetail.discussion", { count: req.conversation.length })}>
        {req.conversation.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.reqDetail.noMessages")}</p>
        ) : (
          <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pe-1">
            {req.conversation.map((m) => {
              const fromClient = m.senderId === req.client.id;
              return (
                <div key={`${m.source}-${m.id}`} className={`flex ${fromClient ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    fromClient ? "rounded-es-sm bg-surface-alt" : "rounded-ee-sm bg-brand-orange-light"
                  }`}>
                    <p className="text-[11px] font-semibold text-ink">
                      {m.senderName}{" "}
                      <span className="font-normal text-muted">
                        {t(m.source === "DIRECT" ? "admin.reqDetail.senderRolePrivate" : "admin.reqDetail.senderRole", { role: t(fromClient ? "admin.reqDetail.senderClient" : "admin.reqDetail.senderTech") })}
                      </span>
                    </p>
                    {m.body && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">{m.body}</p>}
                    {m.imageUrl && (
                      <a href={m.imageUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-semibold text-brand-orange hover:underline">
                        {t("admin.reqDetail.imageAttachment")}
                      </a>
                    )}
                    <p className="mt-1 text-[10px] text-muted">{formatDateTime(m.createdAt, locale)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Review */}
      {req.review && (
        <Section title={t("admin.reqDetail.review")}>
          <div className="flex items-center gap-3">
            <StarRating value={req.review.rating} size={18} />
            <span className="text-sm font-semibold text-ink">{req.review.rating}/5</span>
            <span className="text-xs text-muted">{t("admin.reqDetail.reviewBy", { name: req.review.authorFullName })}</span>
          </div>
          {req.review.comment && <p className="mt-2 text-sm text-muted">{req.review.comment}</p>}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="font-heading text-sm font-semibold text-ink mb-4">{title}</p>
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon size={14} />
        <p className="text-[11px] leading-tight">{label}</p>
      </div>
      <p className={`mt-1.5 font-heading text-lg font-bold ${tone === "danger" ? "text-danger" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function MapLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-brand-orange"
    >
      <Icon size={14} className="text-brand-orange" />
      <span className="flex-1">{label}</span>
      <ExternalLink size={12} className="text-muted" />
    </a>
  );
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-alt px-3 py-2.5">
      <p className="text-[10px] text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-ink break-words" dir={ltr ? "ltr" : undefined}>{value}</p>
    </div>
  );
}
